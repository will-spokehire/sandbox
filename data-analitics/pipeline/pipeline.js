#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const { createLogger, FileUtils } = require('../lib');

class DataProcessingPipeline {
  constructor() {
    this.logger = createLogger('Data Pipeline');
    this.fileUtils = new FileUtils();
    this.baseDir = path.join(__dirname, '..');
    this.dataDir = path.join(this.baseDir, 'data');
    this.scriptsDir = path.join(this.baseDir, 'scripts');
    this.imageScriptsDir = path.join(this.baseDir, 'image-scripts');
    this.runsDir = path.join(this.baseDir, 'pipeline', 'runs');

    // Pipeline steps configuration
    this.pipelineSteps = [
      {
        name: 'Convert CSV Sources',
        script: 'convertCsvToJson.js',
        description: 'Convert cleansed_database.csv to JSON format'
      },
      {
        name: 'Convert Catalog CSV',
        script: 'convertCatalogCsvToJson.js',
        description: 'Convert web_site_catalog_products.csv to JSON format'
      },
      {
        name: 'Analyze Matching Patterns',
        script: 'analyzeMatchingPatterns.js',
        description: 'Analyze email and vehicle matching patterns'
      },
      {
        name: 'Merge Vehicle Data',
        script: 'mergeVehicleData.js',
        description: 'Merge data from all sources into unified structure'
      },
      {
        name: 'Sophisticated Matching',
        script: 'sophisticatedVehicleMatcher.js',
        description: 'Apply sophisticated matching algorithms to create improved catalog'
      }
    ];
  }

  /**
   * Generate timestamped run directory name
   */
  generateRunName() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-mm-ss format
    return `run_${timestamp}`;
  }

  /**
   * Create run directory and copy pipeline scripts
   */
  async createRunDirectory() {
    const runName = this.generateRunName();
    const runDir = path.join(this.runsDir, runName);

    this.logger.section(`Creating Pipeline Run: ${runName}`);

    try {
      // Create run directory structure
      await fs.ensureDir(path.join(runDir, 'input'));
      await fs.ensureDir(path.join(runDir, 'output'));
      await fs.ensureDir(path.join(runDir, 'logs'));

      // Copy pipeline scripts to run directory
      for (const step of this.pipelineSteps) {
        const scriptPath = path.join(__dirname, step.script);
        if (await fs.pathExists(scriptPath)) {
          await fs.copy(scriptPath, path.join(runDir, step.script));
          this.logger.info(`Copied ${step.script} to run directory`);
        }
      }

      // Copy source data files
      const sourceFiles = [
        'cleansed_database.csv',
        'web_site_catalog_products.csv',
        'submission.from.1march.2025.json'
      ];

      for (const file of sourceFiles) {
        const sourcePath = path.join(this.dataDir, file);
        if (await fs.pathExists(sourcePath)) {
          await fs.copy(sourcePath, path.join(runDir, 'input', file));
          this.logger.info(`Copied source file: ${file}`);
        }
      }

      // Create run configuration
      const runConfig = {
        runName,
        createdAt: new Date().toISOString(),
        pipelineSteps: this.pipelineSteps,
        sourceFiles,
        status: 'running',
        currentStep: 0,
        results: {}
      };

      await fs.writeJson(path.join(runDir, 'run_config.json'), runConfig, { spaces: 2 });

      this.logger.success(`Created pipeline run directory: ${runDir}`);
      return { runName, runDir, runConfig };

    } catch (error) {
      this.logger.error('Failed to create run directory:', error);
      throw error;
    }
  }

  /**
   * Execute a single pipeline step
   */
  async executeStep(step, runDir) {
    const { name, script, description } = step;

    this.logger.subsection(`${name} - ${description}`);

    const scriptPath = path.join(runDir, script);
    const stepLogPath = path.join(runDir, 'logs', `${path.parse(script).name}.log`);

    try {
      // Capture console output
      const originalConsole = { ...console };
      const logs = [];

      // Override console methods to capture output
      ['log', 'info', 'warn', 'error'].forEach(method => {
        console[method] = (...args) => {
          const message = args.join(' ');
          logs.push(`[${new Date().toISOString()}] ${message}`);
          originalConsole[method](...args);
        };
      });

      this.logger.info(`Executing: ${script}`);

      // Execute the script
      const { execSync } = require('child_process');
      const result = execSync(`cd "${runDir}" && node "${script}"`, {
        encoding: 'utf8',
        timeout: 300000, // 5 minutes timeout
        stdio: 'pipe'
      });

      // Restore original console
      Object.assign(console, originalConsole);

      // Save logs
      await fs.writeFile(stepLogPath, logs.join('\n'));

      // Check if step produced expected output
      const expectedOutputs = this.getExpectedOutputs(script);
      let success = true;
      const outputs = {};

      for (const expectedOutput of expectedOutputs) {
        const outputPath = path.join(runDir, 'output', expectedOutput);
        const exists = await fs.pathExists(outputPath);
        outputs[expectedOutput] = exists;

        if (!exists) {
          success = false;
          this.logger.warning(`Expected output not found: ${expectedOutput}`);
        } else {
          this.logger.success(`Generated: ${expectedOutput}`);
        }
      }

      return {
        success,
        outputs,
        logs: logs.join('\n'),
        executionTime: Date.now()
      };

    } catch (error) {
      // Restore original console
      Object.assign(console, console);

      const errorLogs = [`[${new Date().toISOString()}] ERROR: ${error.message}`];
      await fs.writeFile(stepLogPath, errorLogs.join('\n'));

      this.logger.error(`Step failed: ${name}`, error.message);
      return {
        success: false,
        outputs: {},
        logs: errorLogs.join('\n'),
        error: error.message,
        executionTime: Date.now()
      };
    }
  }

  /**
   * Get expected outputs for each pipeline step
   */
  getExpectedOutputs(script) {
    const outputs = {
      'convertCsvToJson.js': ['cleansed_database.json'],
      'convertCatalogCsvToJson.js': ['catalog_products.json'],
      'analyzeMatchingPatterns.js': ['matching_patterns_analysis.json'],
      'mergeVehicleData.js': ['final_vehicle_catalog.json'],
      'sophisticatedVehicleMatcher.js': ['improved_vehicle_catalog.json']
    };
    return outputs[script] || [];
  }

  /**
   * Update run configuration with step results
   */
  async updateRunConfig(runDir, stepIndex, stepResults) {
    const configPath = path.join(runDir, 'run_config.json');
    const config = await fs.readJson(configPath);

    config.currentStep = stepIndex;
    config.results[stepIndex] = {
      step: this.pipelineSteps[stepIndex].name,
      ...stepResults
    };

    if (!stepResults.success) {
      config.status = 'failed';
    } else if (stepIndex === this.pipelineSteps.length - 1) {
      config.status = 'completed';
    }

    config.lastUpdated = new Date().toISOString();
    await fs.writeJson(configPath, config, { spaces: 2 });
  }

  /**
   * Copy final results to main data directory
   */
  async copyResultsToDataDir(runDir) {
    const runOutputDir = path.join(runDir, 'output');

    try {
      // Copy final improved catalog to main data directory
      const improvedCatalog = path.join(runOutputDir, 'improved_vehicle_catalog.json');
      if (await fs.pathExists(improvedCatalog)) {
        await fs.copy(improvedCatalog, path.join(this.dataDir, 'improved_vehicle_catalog.json'));
        this.logger.success('Copied improved_vehicle_catalog.json to data directory');
      }

      // Copy other important outputs
      const importantOutputs = [
        'cleansed_database.json',
        'catalog_products.json',
        'matching_patterns_analysis.json',
        'final_vehicle_catalog.json'
      ];

      for (const output of importantOutputs) {
        const sourcePath = path.join(runOutputDir, output);
        if (await fs.pathExists(sourcePath)) {
          await fs.copy(sourcePath, path.join(this.dataDir, output));
          this.logger.info(`Copied ${output} to data directory`);
        }
      }

    } catch (error) {
      this.logger.warning('Failed to copy some results to data directory:', error.message);
    }
  }

  /**
   * Copy latest improved catalog to public/data directory for web interface
   */
  async copyToPublicDataDir(runDir) {
    const runOutputDir = path.join(runDir, 'output');
    const publicDataDir = path.join(this.baseDir, 'public', 'data');

    try {
      // Ensure public/data directory exists
      await fs.ensureDir(publicDataDir);

      // Copy improved catalog to public/data directory
      const improvedCatalog = path.join(runOutputDir, 'improved_vehicle_catalog.json');
      if (await fs.pathExists(improvedCatalog)) {
        const publicCatalogPath = path.join(publicDataDir, 'improved_vehicle_catalog.json');
        await fs.copy(improvedCatalog, publicCatalogPath);
        this.logger.success('Copied improved_vehicle_catalog.json to public/data directory');
        
        // Also create a timestamped backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupPath = path.join(publicDataDir, `improved_vehicle_catalog_${timestamp}.json`);
        await fs.copy(improvedCatalog, backupPath);
        this.logger.info(`Created timestamped backup: improved_vehicle_catalog_${timestamp}.json`);
      } else {
        this.logger.warning('improved_vehicle_catalog.json not found in run output');
      }

    } catch (error) {
      this.logger.warning('Failed to copy results to public/data directory:', error.message);
    }
  }

  /**
   * Run the complete pipeline
   */
  async run() {
    try {
      this.logger.section('🚀 Starting Data Processing Pipeline');

      // Create run directory
      const { runName, runDir, runConfig } = await this.createRunDirectory();

      // Execute each pipeline step
      let allStepsSuccessful = true;

      for (let i = 0; i < this.pipelineSteps.length; i++) {
        const step = this.pipelineSteps[i];
        const stepResults = await this.executeStep(step, runDir);
        await this.updateRunConfig(runDir, i, stepResults);

        if (!stepResults.success) {
          allStepsSuccessful = false;
          this.logger.error(`Pipeline failed at step: ${step.name}`);
          break;
        }

        this.logger.success(`Completed: ${step.name}`);
      }

      // Copy results to main data directory if all steps successful
      if (allStepsSuccessful) {
        await this.copyResultsToDataDir(runDir);
        await this.copyToPublicDataDir(runDir);
        this.logger.success('✅ Pipeline completed successfully!');
      } else {
        this.logger.error('❌ Pipeline failed - check logs for details');
        process.exit(1);
      }

      // Generate final run summary
      await this.generateRunSummary(runDir, runName, allStepsSuccessful);

    } catch (error) {
      this.logger.error('Pipeline execution failed:', error);
      process.exit(1);
    }
  }

  /**
   * Generate run summary report
   */
  async generateRunSummary(runDir, runName, success) {
    const configPath = path.join(runDir, 'run_config.json');
    const config = await fs.readJson(configPath);

    const summary = {
      runName,
      status: success ? 'completed' : 'failed',
      completedAt: new Date().toISOString(),
      totalSteps: this.pipelineSteps.length,
      successfulSteps: success ? this.pipelineSteps.length : config.currentStep,
      duration: Date.now() - new Date(config.createdAt).getTime(),
      results: config.results
    };

    await fs.writeJson(path.join(runDir, 'run_summary.json'), summary, { spaces: 2 });

    this.logger.section('Pipeline Summary');
    this.logger.info(`Run: ${runName}`);
    this.logger.info(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    this.logger.info(`Duration: ${Math.round(summary.duration / 1000)} seconds`);
    this.logger.info(`Steps completed: ${summary.successfulSteps}/${summary.totalSteps}`);
    this.logger.info(`Run directory: ${runDir}`);
  }

  /**
   * List previous pipeline runs
   */
  async listRuns() {
    try {
      const runs = await fs.readdir(this.runsDir);
      const runDetails = [];

      for (const run of runs.sort().reverse()) {
        if (run.startsWith('run_')) {
          const runPath = path.join(this.runsDir, run);
          const configPath = path.join(runPath, 'run_config.json');
          const summaryPath = path.join(runPath, 'run_summary.json');

          if (await fs.pathExists(configPath)) {
            const config = await fs.readJson(configPath);
            const summary = await fs.pathExists(summaryPath) ?
              await fs.readJson(summaryPath) : null;

            runDetails.push({
              name: run,
              status: summary?.status || config.status || 'unknown',
              created: config.createdAt,
              duration: summary?.duration || null,
              steps: summary?.successfulSteps || 0,
              totalSteps: summary?.totalSteps || this.pipelineSteps.length
            });
          }
        }
      }

      return runDetails;

    } catch (error) {
      this.logger.warning('Failed to list runs:', error.message);
      return [];
    }
  }

  /**
   * Copy latest improved catalog to public/data directory
   */
  async copyLatestToPublic() {
    try {
      const runs = await this.listRuns();
      if (runs.length === 0) {
        this.logger.warning('No pipeline runs found');
        return;
      }

      // Find the latest successful run
      const latestRun = runs.find(run => run.status === 'completed');
      if (!latestRun) {
        this.logger.warning('No successful pipeline runs found');
        return;
      }

      const runDir = path.join(this.runsDir, latestRun.name);
      await this.copyToPublicDataDir(runDir);
      this.logger.success(`Copied latest run (${latestRun.name}) to public/data`);

    } catch (error) {
      this.logger.error('Failed to copy latest run to public/data:', error.message);
    }
  }

  /**
   * Show pipeline status and available commands
   */
  showHelp() {
    console.log(`
🚀 SpokeHire Data Processing Pipeline

Usage:
  node pipeline/pipeline.js [command]

Commands:
  run                    - Execute the complete pipeline
  list                   - List previous pipeline runs
  copy-latest            - Copy latest successful run to public/data
  help                   - Show this help message

The pipeline processes data through these steps:
  1. Convert CSV Sources    - Convert CSV files to JSON
  2. Convert Catalog CSV    - Convert catalog CSV to JSON
  3. Analyze Patterns      - Analyze matching patterns
  4. Merge Data            - Merge all data sources
  5. Sophisticated Match   - Apply sophisticated matching

Each run is stored in pipeline/runs/run_YYYY-MM-DDTHH-mm-ss/
    `);
  }
}

// Command line interface
async function main() {
  const pipeline = new DataProcessingPipeline();
  const command = process.argv[2] || 'run';

  switch (command) {
    case 'run':
      await pipeline.run();
      break;

    case 'list':
      const runs = await pipeline.listRuns();
      console.log('\n📋 Pipeline Runs:');
      console.log('='.repeat(80));
      runs.forEach((run, index) => {
        const status = run.status === 'completed' ? '✅' : run.status === 'failed' ? '❌' : '🔄';
        const duration = run.duration ? `${Math.round(run.duration / 1000)}s` : 'N/A';
        console.log(`${index + 1}. ${run.name} ${status} (${duration}) - ${run.steps}/${run.totalSteps} steps`);
      });
      break;

    case 'copy-latest':
      await pipeline.copyLatestToPublic();
      break;

    case 'help':
    default:
      pipeline.showHelp();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = DataProcessingPipeline;
