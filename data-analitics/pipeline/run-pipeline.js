#!/usr/bin/env node

/**
 * Pipeline Runner
 * 
 * Executes the vehicle catalog processing pipeline based on configuration
 * 
 * Usage:
 * node run-pipeline.js [--step step-id] [--config config-file]
 * 
 * Examples:
 * node run-pipeline.js                                    # Run all steps
 * node run-pipeline.js --step process-duplicates         # Run specific step
 * node run-pipeline.js --config custom-config.json      # Use custom config
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PipelineRunner {
  constructor(configPath = 'pipeline-config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.logs = [];
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error(`❌ Error loading config from ${this.configPath}:`, error.message);
      process.exit(1);
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.logs.push(logEntry);
    
    const prefix = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    }[level] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runStep(step) {
    this.log(`Starting step: ${step.name}`, 'info');
    
    try {
      // Check if step is enabled
      if (step.enabled === false) {
        this.log(`Step ${step.id} is disabled, skipping`, 'warning');
        return { success: true, skipped: true };
      }

      // Check if script exists
      const scriptPath = path.join(__dirname, step.script);
      if (!fs.existsSync(scriptPath)) {
        this.log(`Script not found: ${scriptPath}`, 'error');
        return { success: false, error: 'Script not found' };
      }

      // Check if input file exists
      if (step.input && !fs.existsSync(step.input)) {
        this.log(`Input file not found: ${step.input}`, 'error');
        return { success: false, error: 'Input file not found' };
      }

      // Run the script
      const startTime = Date.now();
      const command = `node "${scriptPath}" "${step.input}" "${step.output}"`;
      
      this.log(`Executing: ${command}`, 'info');
      
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: __dirname,
        stdio: 'pipe'
      });
      
      const duration = Date.now() - startTime;
      
      this.log(`Step completed in ${duration}ms`, 'success');
      
      if (output) {
        console.log(output);
      }
      
      return { 
        success: true, 
        duration,
        output: output.trim()
      };
      
    } catch (error) {
      this.log(`Step failed: ${error.message}`, 'error');
      return { 
        success: false, 
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  async runPipeline(stepId = null) {
    this.log(`Starting pipeline: ${this.config.name}`, 'info');
    this.log(`Configuration: ${this.configPath}`, 'info');
    
    const steps = stepId 
      ? this.config.steps.filter(step => step.id === stepId)
      : this.config.steps.filter(step => step.enabled !== false);
    
    if (steps.length === 0) {
      this.log(`No steps found${stepId ? ` for step ID: ${stepId}` : ''}`, 'error');
      return { success: false };
    }
    
    this.log(`Running ${steps.length} step(s)`, 'info');
    
    const results = [];
    let overallSuccess = true;
    
    for (const step of steps) {
      const result = await this.runStep(step);
      results.push({ step: step.id, ...result });
      
      if (!result.success && !result.skipped) {
        overallSuccess = false;
        this.log(`Pipeline failed at step: ${step.id}`, 'error');
        break;
      }
    }
    
    // Save logs
    this.saveLogs();
    
    // Generate summary
    this.generateSummary(results, overallSuccess);
    
    return { success: overallSuccess, results };
  }

  saveLogs() {
    const logPath = path.join(__dirname, 'logs', `pipeline-${Date.now()}.json`);
    const logDir = path.dirname(logPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.writeFileSync(logPath, JSON.stringify({
      config: this.configPath,
      timestamp: new Date().toISOString(),
      logs: this.logs
    }, null, 2));
    
    this.log(`Logs saved to: ${logPath}`, 'info');
  }

  generateSummary(results, success) {
    const summary = {
      pipeline: this.config.name,
      timestamp: new Date().toISOString(),
      success,
      totalSteps: results.length,
      successfulSteps: results.filter(r => r.success).length,
      failedSteps: results.filter(r => !r.success && !r.skipped).length,
      skippedSteps: results.filter(r => r.skipped).length,
      results
    };
    
    console.log('\n📊 Pipeline Summary:');
    console.log(`   Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Total Steps: ${summary.totalSteps}`);
    console.log(`   Successful: ${summary.successfulSteps}`);
    console.log(`   Failed: ${summary.failedSteps}`);
    console.log(`   Skipped: ${summary.skippedSteps}`);
    
    if (results.some(r => r.duration)) {
      const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
      console.log(`   Total Duration: ${totalDuration}ms`);
    }
    
    // Save summary
    const summaryPath = path.join(__dirname, 'reports', `pipeline-summary-${Date.now()}.json`);
    const summaryDir = path.dirname(summaryPath);
    
    if (!fs.existsSync(summaryDir)) {
      fs.mkdirSync(summaryDir, { recursive: true });
    }
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    this.log(`Summary saved to: ${summaryPath}`, 'info');
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  let stepId = null;
  let configPath = 'pipeline-config.json';
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--step' && i + 1 < args.length) {
      stepId = args[i + 1];
      i++;
    } else if (args[i] === '--config' && i + 1 < args.length) {
      configPath = args[i + 1];
      i++;
    }
  }
  
  const runner = new PipelineRunner(configPath);
  
  runner.runPipeline(stepId)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Pipeline runner error:', error.message);
      process.exit(1);
    });
}

module.exports = { PipelineRunner };
