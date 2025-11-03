import React, { useState } from 'react';
import { CogIcon, ClockIcon, ShieldCheckIcon } from './Icons';

interface StrategyMetrics {
  name: string;
  accuracy: number;
  latency: string;
  cost: 'Low' | 'Medium' | 'High';
  complexity: 'Easy' | 'Medium' | 'Hard';
  description: string;
  pros: string[];
  cons: string[];
}

const strategies: StrategyMetrics[] = [
  {
    name: 'Twilio Native AMD',
    accuracy: 85,
    latency: '1-3s',
    cost: 'Low',
    complexity: 'Easy',
    description: 'Built-in Twilio machine detection with standard parameters',
    pros: ['Fast processing', 'Reliable', 'No additional setup', 'Industry standard'],
    cons: ['Limited customization', 'Basic detection logic', 'Fixed parameters']
  },
  {
    name: 'Jambonz SIP-Enhanced',
    accuracy: 90,
    latency: '2-4s',
    cost: 'Medium',
    complexity: 'Medium',
    description: 'Advanced SIP-based detection with custom recognizers and tunable parameters',
    pros: ['Highly customizable', 'Better edge case handling', 'Word count analysis', 'Fallback mechanisms'],
    cons: ['Requires Jambonz setup', 'More complex configuration', 'Additional infrastructure']
  },
  {
    name: 'Hugging Face ML',
    accuracy: 92,
    latency: '2-5s',
    cost: 'Medium',
    complexity: 'Hard',
    description: 'AI-powered detection using fine-tuned wav2vec model for voicemail classification',
    pros: ['Highest accuracy', 'Continuously improving', 'Confidence scoring', 'Fine-tunable'],
    cons: ['Requires Python service', 'Higher latency', 'Complex setup', 'Resource intensive']
  },
  {
    name: 'Gemini Flash Real-Time',
    accuracy: 88,
    latency: '1-3s',
    cost: 'High',
    complexity: 'Medium',
    description: 'LLM-based multimodal analysis with contextual understanding',
    pros: ['Context-aware', 'Handles ambiguous cases', 'Natural language reasoning', 'Fast processing'],
    cons: ['Higher cost per call', 'Potential hallucination', 'API dependency', 'Token usage']
  }
];

const StrategyComparison: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runStrategyTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-all-strategies', {
        method: 'POST',
      });
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Failed to test strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-100">AMD Strategy Comparison</h2>
        <button
          onClick={runStrategyTest}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-md transition-colors disabled:opacity-50"
        >
          <CogIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Testing...' : 'Test All Strategies'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {strategies.map((strategy, index) => (
          <div
            key={strategy.name}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedStrategy === strategy.name
                ? 'border-brand-blue bg-gray-700/50'
                : 'border-gray-600 bg-gray-700/20 hover:border-gray-500'
            }`}
            onClick={() => setSelectedStrategy(selectedStrategy === strategy.name ? null : strategy.name)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-100">{strategy.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">{strategy.accuracy}%</span>
                <div className="w-16 bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-brand-blue h-2 rounded-full"
                    style={{ width: `${strategy.accuracy}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1 text-gray-400" />
                <span className="text-gray-300">{strategy.latency}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">$</span>
                <span className={getCostColor(strategy.cost)}>{strategy.cost}</span>
              </div>
              <div className="flex items-center">
                <ShieldCheckIcon className="h-3 w-3 mr-1 text-gray-400" />
                <span className={getComplexityColor(strategy.complexity)}>{strategy.complexity}</span>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-3">{strategy.description}</p>

            {selectedStrategy === strategy.name && (
              <div className="space-y-3 border-t border-gray-600 pt-3">
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-1">Pros:</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {strategy.pros.map((pro, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-400 mr-1">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-1">Cons:</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {strategy.cons.map((con, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-400 mr-1">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {testResults && (
        <div className="border-t border-gray-600 pt-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Live Test Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Average Confidence</div>
              <div className="text-xl font-bold text-brand-blue">
                {Math.round(testResults.metrics.averageConfidence * 100)}%
              </div>
            </div>
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Average Processing Time</div>
              <div className="text-xl font-bold text-brand-blue">
                {Math.round(testResults.metrics.averageProcessingTime)}ms
              </div>
            </div>
            <div className="bg-gray-700/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Consensus Result</div>
              <div className="text-xl font-bold text-brand-blue capitalize">
                {testResults.metrics.consensusResult}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-200">Strategy Breakdown:</h4>
            {testResults.metrics.strategyBreakdown.map((result: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-700/20 rounded">
                <span className="text-gray-300">{result.strategy}</span>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`capitalize ${
                    result.result === 'human' ? 'text-green-400' : 
                    result.result === 'machine' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {result.result}
                  </span>
                  <span className="text-gray-400">{result.confidence * 100}%</span>
                  <span className="text-gray-400">{result.processingTime}ms</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-200 mb-2">Recommendations:</h4>
            <ul className="space-y-1">
              {testResults.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <span className="text-brand-blue mr-2">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyComparison;