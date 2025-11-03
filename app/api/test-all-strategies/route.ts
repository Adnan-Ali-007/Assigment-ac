/**
 * Test All AMD Strategies
 * Comprehensive testing endpoint that demonstrates all 4 strategies
 */

import { NextResponse } from 'next/server';
import { runMultiStrategyAMD } from '@/lib/amdStrategies';

export async function POST() {
  try {
    console.log('=== TESTING ALL AMD STRATEGIES ===');
    
    // Mock audio buffer for testing
    const mockAudioBuffer = Buffer.alloc(1024);
    
    // Test all strategies
    const strategies = ['twilio-native', 'jambonz-sip', 'huggingface-ml', 'gemini-flash'];
    
    console.log('Running multi-strategy AMD analysis...');
    const results = await runMultiStrategyAMD(mockAudioBuffer, strategies);
    
    // Calculate performance metrics
    const metrics = {
      totalStrategies: results.length,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      averageProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
      consensusResult: getMajorityResult(results),
      strategyBreakdown: results.map(r => ({
        strategy: r.strategy,
        result: r.result,
        confidence: Math.round(r.confidence * 100) / 100,
        processingTime: r.processingTime
      }))
    };
    
    console.log('Multi-strategy AMD results:', metrics);
    
    return NextResponse.json({
      success: true,
      message: 'All AMD strategies tested successfully',
      results: results,
      metrics: metrics,
      recommendations: generateRecommendations(results)
    });
    
  } catch (error) {
    console.error('Error testing AMD strategies:', error);
    return NextResponse.json({
      error: 'Failed to test AMD strategies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getMajorityResult(results: any[]): string {
  const counts = results.reduce((acc, r) => {
    acc[r.result] = (acc[r.result] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(counts).reduce((a: any, b: any) => 
    counts[a[0]] > counts[b[0]] ? a : b
  )[0];
}

function generateRecommendations(results: any[]): string[] {
  const recommendations = [];
  
  // Find highest confidence strategy
  const highestConfidence = results.reduce((max, r) => 
    r.confidence > max.confidence ? r : max
  );
  
  // Find fastest strategy
  const fastest = results.reduce((min, r) => 
    r.processingTime < min.processingTime ? r : min
  );
  
  recommendations.push(`Highest confidence: ${highestConfidence.strategy} (${Math.round(highestConfidence.confidence * 100)}%)`);
  recommendations.push(`Fastest processing: ${fastest.strategy} (${fastest.processingTime}ms)`);
  
  // Strategy-specific recommendations
  const humanResults = results.filter(r => r.result === 'human');
  const machineResults = results.filter(r => r.result === 'machine');
  
  if (humanResults.length > machineResults.length) {
    recommendations.push('Majority detected human - recommend connecting call');
  } else if (machineResults.length > humanResults.length) {
    recommendations.push('Majority detected machine - recommend hanging up');
  } else {
    recommendations.push('Mixed results - recommend using highest confidence strategy');
  }
  
  return recommendations;
}