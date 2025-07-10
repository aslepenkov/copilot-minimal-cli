#!/usr/bin/env ts-node

/**
 * MVP Example - Business Entity Analysis
 * 
 * Demonstrates how to use the MVP agent programmatically
 */

import * as path from 'path';
import { MVPStandaloneAgent, defaultMVPConfig } from './agent.js';

async function runExample() {
	console.log('🚀 MVP Business Entity Analyzer Example\n');

	// Configuration for the MVP
	const config = {
		...defaultMVPConfig,
		workspacePath: path.resolve('../'), // Analyze parent directory
		debugMode: true,
		maxIterations: 5,
		copilotApiKey: process.env.GITHUB_TOKEN // Optional - will use mock if not provided
	};

	try {
		console.log('🔧 Initializing MVP agent...');
		const agent = new MVPStandaloneAgent(config.workspacePath, config);
		await agent.initialize();

		console.log('✅ Agent initialized!\n');

		// Example analysis prompts
		const analysisPrompts = [
			"analyze business entities in this code",
		];

		for (const prompt of analysisPrompts) {
			console.log(`\n🔍 Running analysis: "${prompt}"`);
			console.log('=' .repeat(60));

			const result = await agent.analyzeWorkspace(prompt);

			if (result.success) {
				console.log(`✅ Analysis completed in ${result.iterations} iterations`);
				
				// Display analysis data
				if (result.analysisData) {
					const data = result.analysisData;
					
					if (data.businessEntities && data.businessEntities.length > 0) {
						console.log(`\n🏢 Found ${data.businessEntities.length} business entities:`);
						data.businessEntities.forEach((entity: any, index: number) => {
							console.log(`  ${index + 1}. ${entity.name} (${entity.type})`);
							if (entity.description) {
								console.log(`     - ${entity.description}`);
							}
						});
					}
					
					if (data.metrics && Object.keys(data.metrics).length > 0) {
						console.log('\n📈 Metrics found:');
						Object.entries(data.metrics).forEach(([key, value]) => {
							console.log(`  ${key}: ${value}`);
						});
					}
				}

				// Display response preview
				console.log(`\n💬 Response preview:`);
				console.log(result.response.substring(0, 300) + '...');
			} else {
				console.error(`❌ Analysis failed: ${result.error}`);
			}
		}

		console.log('\n📁 Analysis complete! Check logs/ for detailed results.');

	} catch (error: any) {
		console.error('💥 Example failed:', error.message);
		console.error(error.stack);
	}
}

// Run the example
if (require.main === module) {
	runExample().catch(console.error);
}

export { runExample };
