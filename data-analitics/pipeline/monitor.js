const fs = require('fs-extra');
const path = require('path');
const { createLogger } = require('../lib');

class PipelineMonitor {
  constructor() {
    this.logger = createLogger('Pipeline Monitor');
    this.baseDir = path.join(__dirname, '..');
    this.runsDir = path.join(this.baseDir, 'pipeline', 'runs');
    this.metricsFile = path.join(this.baseDir, 'pipeline', 'metrics.json');
  }

  /**
   * Collect metrics from a pipeline run
   */
  async collectRunMetrics(runDir) {
    const metrics = {
      runName: path.basename(runDir),
      timestamp: new Date().toISOString(),
      steps: {},
      overall: {
        totalExecutionTime: 0,
        successfulSteps: 0,
        failedSteps: 0,
        totalRecords: 0,
        memoryPeak: 0
      }
    };

    try {
      // Read run configuration
      const configPath = path.join(runDir, 'run_config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        metrics.config = config;
      }

      // Read run summary
      const summaryPath = path.join(runDir, 'run_summary.json');
      if (await fs.pathExists(summaryPath)) {
        const summary = await fs.readJson(summaryPath);
        metrics.summary = summary;
      }

      // Analyze each step's log file
      const logsDir = path.join(runDir, 'logs');
      if (await fs.pathExists(logsDir)) {
        const logFiles = await fs.readdir(logsDir);

        for (const logFile of logFiles) {
          if (logFile.endsWith('.log')) {
            const stepName = path.basename(logFile, '.log');
            const logPath = path.join(logsDir, logFile);
            const logContent = await fs.readFile(logPath, 'utf8');

            metrics.steps[stepName] = this.analyzeStepLog(logContent);
          }
        }
      }

      // Calculate overall metrics
      metrics.overall = this.calculateOverallMetrics(metrics.steps);

      return metrics;

    } catch (error) {
      this.logger.warning('Failed to collect metrics:', error.message);
      return metrics;
    }
  }

  /**
   * Analyze a step's log file for metrics
   */
  analyzeStepLog(logContent) {
    const lines = logContent.split('\n');
    const metrics = {
      executionTime: 0,
      recordsProcessed: 0,
      errors: 0,
      warnings: 0,
      memoryUsage: [],
      startTime: null,
      endTime: null
    };

    for (const line of lines) {
      // Extract timing information
      const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      if (timeMatch) {
        const timestamp = new Date(timeMatch[1]);
        if (!metrics.startTime || timestamp < metrics.startTime) {
          metrics.startTime = timestamp;
        }
        if (!metrics.endTime || timestamp > metrics.endTime) {
          metrics.endTime = timestamp;
        }
      }

      // Count records processed
      const recordMatch = line.match(/Processed (\d+) records?/i);
      if (recordMatch) {
        metrics.recordsProcessed += parseInt(recordMatch[1]);
      }

      // Count errors and warnings
      if (line.includes('❌') || line.includes('ERROR')) {
        metrics.errors++;
      }
      if (line.includes('⚠️') || line.includes('WARNING')) {
        metrics.warnings++;
      }

      // Extract memory usage (if logged)
      const memoryMatch = line.match(/Memory:?\s*(\d+(?:\.\d+)?)\s*(MB|GB)/i);
      if (memoryMatch) {
        const value = parseFloat(memoryMatch[1]);
        const unit = memoryMatch[2].toUpperCase();
        const bytes = unit === 'GB' ? value * 1024 * 1024 * 1024 : value * 1024 * 1024;
        metrics.memoryUsage.push(bytes);
      }
    }

    // Calculate execution time
    if (metrics.startTime && metrics.endTime) {
      metrics.executionTime = metrics.endTime - metrics.startTime;
    }

    // Calculate peak memory usage
    if (metrics.memoryUsage.length > 0) {
      metrics.peakMemory = Math.max(...metrics.memoryUsage);
    }

    return metrics;
  }

  /**
   * Calculate overall pipeline metrics
   */
  calculateOverallMetrics(steps) {
    const overall = {
      totalExecutionTime: 0,
      successfulSteps: 0,
      failedSteps: 0,
      totalRecords: 0,
      peakMemory: 0,
      errors: 0,
      warnings: 0
    };

    for (const [stepName, metrics] of Object.entries(steps)) {
      overall.totalExecutionTime += metrics.executionTime || 0;
      overall.totalRecords += metrics.recordsProcessed || 0;
      overall.errors += metrics.errors || 0;
      overall.warnings += metrics.warnings || 0;

      if (metrics.peakMemory) {
        overall.peakMemory = Math.max(overall.peakMemory, metrics.peakMemory);
      }

      // Check if step was successful (no errors and completed)
      if (metrics.errors === 0 && metrics.executionTime > 0) {
        overall.successfulSteps++;
      } else if (metrics.errors > 0) {
        overall.failedSteps++;
      }
    }

    return overall;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(runDir = null) {
    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        from: null,
        to: null
      },
      summary: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageExecutionTime: 0,
        totalRecordsProcessed: 0
      },
      runs: []
    };

    try {
      const runs = await this.listRuns();

      for (const run of runs) {
        const runMetrics = await this.collectRunMetrics(
          path.join(this.runsDir, run.name)
        );

        report.runs.push({
          name: run.name,
          status: run.status,
          metrics: runMetrics
        });

        // Update summary
        report.summary.totalRuns++;
        if (run.status === 'completed') {
          report.summary.successfulRuns++;
        } else if (run.status === 'failed') {
          report.summary.failedRuns++;
        }

        if (runMetrics.summary?.duration) {
          report.summary.totalRecordsProcessed += runMetrics.overall?.totalRecords || 0;
        }
      }

      // Calculate averages
      if (report.summary.successfulRuns > 0) {
        const successfulRuns = report.runs.filter(r => r.status === 'completed');
        const totalTime = successfulRuns.reduce((sum, run) =>
          sum + (run.metrics?.overall?.totalExecutionTime || 0), 0
        );
        report.summary.averageExecutionTime = totalTime / successfulRuns.length;
      }

      return report;

    } catch (error) {
      this.logger.error('Failed to generate performance report:', error);
      return report;
    }
  }

  /**
   * List all pipeline runs with metadata
   */
  async listRuns(detailed = false) {
    try {
      const entries = await fs.readdir(this.runsDir);
      const runs = [];

      for (const entry of entries) {
        if (entry.startsWith('run_')) {
          const runPath = path.join(this.runsDir, entry);
          const stat = await fs.stat(runPath);

          const runInfo = {
            name: entry,
            path: runPath,
            created: stat.birthtime,
            modified: stat.mtime,
            status: 'unknown'
          };

          // Get detailed info if requested
          if (detailed) {
            const configPath = path.join(runPath, 'run_config.json');
            if (await fs.pathExists(configPath)) {
              const config = await fs.readJson(configPath);
              runInfo.status = config.status;
              runInfo.currentStep = config.currentStep;
              runInfo.totalSteps = config.pipelineSteps?.length || 0;
            }

            const summaryPath = path.join(runPath, 'run_summary.json');
            if (await fs.pathExists(summaryPath)) {
              const summary = await fs.readJson(summaryPath);
              runInfo.summary = summary;
            }
          }

          runs.push(runInfo);
        }
      }

      return runs.sort((a, b) => b.created - a.created);

    } catch (error) {
      this.logger.warning('Failed to list runs:', error.message);
      return [];
    }
  }

  /**
   * Clean up old pipeline runs
   */
  async cleanupOldRuns(keepLast = 10) {
    try {
      this.logger.info(`Cleaning up old runs, keeping last ${keepLast} runs`);

      const runs = await this.listRuns();
      const runsToDelete = runs.slice(keepLast);

      for (const run of runsToDelete) {
        await fs.remove(run.path);
        this.logger.info(`Deleted old run: ${run.name}`);
      }

      this.logger.success(`Cleaned up ${runsToDelete.length} old runs`);
      return runsToDelete.length;

    } catch (error) {
      this.logger.error('Failed to cleanup old runs:', error);
      throw error;
    }
  }

  /**
   * Export metrics to external system (placeholder)
   */
  async exportMetrics(format = 'json') {
    try {
      const report = await this.generatePerformanceReport();

      if (format === 'json') {
        await fs.writeJson(this.metricsFile, report, { spaces: 2 });
        this.logger.success(`Metrics exported to: ${this.metricsFile}`);
        return this.metricsFile;
      }

      // Add other export formats as needed
      return null;

    } catch (error) {
      this.logger.error('Failed to export metrics:', error);
      throw error;
    }
  }

  /**
   * Display pipeline dashboard
   */
  async showDashboard() {
    const runs = await this.listRuns(true);
    const report = await this.generatePerformanceReport();

    console.log('\n🚀 SpokeHire Pipeline Dashboard');
    console.log('='.repeat(50));

    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total Runs: ${report.summary.totalRuns}`);
    console.log(`Successful: ${report.summary.successfulRuns}`);
    console.log(`Failed: ${report.summary.failedRuns}`);
    console.log(`Avg Execution Time: ${Math.round(report.summary.averageExecutionTime / 1000)}s`);
    console.log(`Total Records: ${report.summary.totalRecordsProcessed}`);

    // Recent runs
    console.log('\n📋 Recent Runs:');
    console.log('-'.repeat(50));
    runs.slice(0, 5).forEach((run, index) => {
      const status = run.status === 'completed' ? '✅' : run.status === 'failed' ? '❌' : '🔄';
      const duration = run.summary?.duration ? `${Math.round(run.summary.duration / 1000)}s` : 'N/A';
      console.log(`${index + 1}. ${run.name} ${status} (${duration})`);
    });

    // Step performance
    if (runs.length > 0) {
      console.log('\n⚡ Step Performance:');
      console.log('-'.repeat(30));

      const firstRun = runs.find(r => r.status === 'completed');
      if (firstRun && firstRun.summary?.results) {
        Object.entries(firstRun.summary.results).forEach(([stepIndex, result]) => {
          if (result.success) {
            const duration = result.executionTime ? Math.round(result.executionTime / 1000) : 0;
            console.log(`${result.step}: ${duration}s`);
          }
        });
      }
    }
  }
}

// Command line interface for monitoring
async function main() {
  const monitor = new PipelineMonitor();
  const command = process.argv[2] || 'dashboard';

  switch (command) {
    case 'dashboard':
      await monitor.showDashboard();
      break;

    case 'list':
      const runs = await monitor.listRuns(true);
      console.log('\n📋 Detailed Pipeline Runs:');
      console.log('='.repeat(80));
      runs.forEach((run, index) => {
        const status = run.status === 'completed' ? '✅' : run.status === 'failed' ? '❌' : '🔄';
        console.log(`${index + 1}. ${run.name} ${status} (${run.currentStep || 0}/${run.totalSteps || 0} steps)`);
        console.log(`   Created: ${run.created.toISOString()}`);
        if (run.summary?.duration) {
          console.log(`   Duration: ${Math.round(run.summary.duration / 1000)}s`);
        }
        console.log('');
      });
      break;

    case 'metrics':
      await monitor.exportMetrics();
      break;

    case 'cleanup':
      const keep = parseInt(process.argv[3]) || 10;
      const deleted = await monitor.cleanupOldRuns(keep);
      console.log(`\n🧹 Cleaned up ${deleted} old runs`);
      break;

    case 'help':
    default:
      console.log(`
📊 Pipeline Monitor - Usage:

Commands:
  dashboard          - Show pipeline dashboard with summary
  list              - List all pipeline runs with details
  metrics           - Export metrics to JSON file
  cleanup [keep]    - Clean up old runs (default: keep last 10)
  help              - Show this help message

Examples:
  node pipeline/monitor.js dashboard
  node pipeline/monitor.js list
  node pipeline/monitor.js cleanup 5
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = PipelineMonitor;
