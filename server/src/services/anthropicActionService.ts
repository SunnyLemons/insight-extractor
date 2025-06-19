import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { IInsight } from '../models/Insight';
import { IProject } from '../models/Project';
import { AITriageResult } from './aiTriageService';

// Define the structure of AI Action Generation Result
export interface AnthropicActionGenerationResult {
  actions: {
    domain: string;
    description: string;
    rationale: string;
    riceScoring: {
      reach: number;      // 0-100 scale of users potentially reached
      impact: number;     // 1-10 scale of potential impact
      confidence: number; // 0-100% confidence in the action
      effort: number;     // 1-10 scale of effort required
      priorityScore: number; // Calculated RICE score
    };
    priority: number;     // Overall priority (1-10)
  }[];
  fullReasoning: string;
  keyInsights: string[];
  potentialChallenges: string[];
}

export class AnthropicActionService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('Anthropic API key is not set in environment variables');
    }

    this.client = new Anthropic({
      apiKey: apiKey
    });
  }

  // Helper method to extract JSON from text
  private extractJSON(text: string): string {
    // Look for JSON between first { and last }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  }

  // Robust JSON parsing with fallback
  private parseResponse(responseText: string): AnthropicActionGenerationResult {
    try {
      // First, try direct parsing
      const parsedResult = JSON.parse(responseText);
      
      // Validate the parsed result has required fields
      if (
        parsedResult.actions && 
        Array.isArray(parsedResult.actions) && 
        parsedResult.fullReasoning && 
        parsedResult.keyInsights && 
        parsedResult.potentialChallenges
      ) {
        // Ensure each action has proper RICE scoring
        parsedResult.actions.forEach((action: {
          riceScoring?: {
            reach?: number;
            impact?: number;
            confidence?: number;
            effort?: number;
            priorityScore?: number;
          }
        }) => {
          if (!action.riceScoring) {
            action.riceScoring = {
              reach: 50,
              impact: 5,
              confidence: 70,
              effort: 3,
              priorityScore: 5
            };
          }
          
          // Calculate priority score if not provided
          if (!action.riceScoring.priorityScore) {
            action.riceScoring.priorityScore = Math.round(
              (action.riceScoring.reach || 50) * 
              (action.riceScoring.impact || 5) * 
              (action.riceScoring.confidence || 70) / 
              ((action.riceScoring.effort || 3) * 100)
            );
          }
        });

        return parsedResult;
      }
    } catch (directParseError) {
      console.warn('Direct JSON parsing failed, attempting extraction');
    }

    try {
      // Try extracting JSON from text
      const extractedJson = this.extractJSON(responseText);
      const parsedResult = JSON.parse(extractedJson);
      
      // Similar validation and scoring as above
      parsedResult.actions.forEach((action: {
        riceScoring?: {
          reach?: number;
          impact?: number;
          confidence?: number;
          effort?: number;
          priorityScore?: number;
        }
      }) => {
        if (!action.riceScoring) {
          action.riceScoring = {
            reach: 50,
            impact: 5,
            confidence: 70,
            effort: 3,
            priorityScore: 5
          };
        }
        
        if (!action.riceScoring.priorityScore) {
          action.riceScoring.priorityScore = Math.round(
            (action.riceScoring.reach || 50) * 
            (action.riceScoring.impact || 5) * 
            (action.riceScoring.confidence || 70) / 
            ((action.riceScoring.effort || 3) * 100)
          );
        }
      });

      return parsedResult;
    } catch (extractionError) {
      console.error('Failed to extract and parse JSON:', extractionError);
    }

    // Fallback to manual parsing if all else fails
    return {
      actions: [{
        domain: 'Product UX',
        description: 'Investigate and improve feature based on user feedback',
        rationale: 'Unable to parse detailed AI response',
        riceScoring: {
          reach: 50,
          impact: 5,
          confidence: 70,
          effort: 3,
          priorityScore: 5
        },
        priority: 5
      }],
      fullReasoning: 'AI response could not be parsed automatically',
      keyInsights: ['Parsing error occurred'],
      potentialChallenges: ['Unable to extract detailed insights']
    };
  }

  async generateActions(
    insight: IInsight, 
    triageResult: AITriageResult,
    project?: IProject
  ): Promise<AnthropicActionGenerationResult> {
    try {
      // Construct comprehensive prompt for Claude
      const prompt = `
You are an expert product strategist specializing in generating actionable insights with precise RICE scoring.

Insight Context:
- Source: ${insight.source}
- Text: ${insight.text}
- Triage Impact: ${triageResult.impact}
- Triage Score: ${triageResult.score}

Project Context:
${project ? `
- Project Name: ${project.name}
- Value Proposition: ${project.valueProposition || 'Not specified'}
- North Star Objective: ${project.northStarObjective || 'Not specified'}
- Core Features: ${project.coreFeatures?.join(', ') || 'Not specified'}
- Ideal Customer Profile: ${project.idealCustomerProfile || 'Not specified'}
` : 'No specific project context provided'}

RICE Scoring Guidelines:
1. Reach (0-100):
   - How many users/customers will this action impact?
   - Consider total addressable market and potential user base
   - Align with project's ideal customer profile

2. Impact (1-10):
   - Potential transformative effect on user experience
   - Alignment with north star objective
   - Potential to solve core user problems

3. Confidence (0-100):
   - Likelihood of successful implementation
   - Clarity of action and potential outcomes
   - Based on insight source and triage score

4. Effort (1-10):
   - Resources required for implementation
   - Technical complexity
   - Time and team capacity needed

Task:
1. Generate 3-5 actionable strategies
2. For EACH action, provide:
   - Specific domain
   - Detailed description
   - Comprehensive rationale
   - Precise RICE scoring
   - Overall priority

Response Format (Strict JSON):
{
  "actions": [
    {
      "domain": "string",
      "description": "string",
      "rationale": "string",
      "riceScoring": {
        "reach": number,
        "impact": number,
        "confidence": number,
        "effort": number,
        "priorityScore": number
      },
      "priority": number
    }
  ],
  "fullReasoning": "string",
  "keyInsights": ["string"],
  "potentialChallenges": ["string"]
}

Scoring Calculation:
- Priority Score = (Reach * Impact * Confidence) / Effort
- Normalize to 1-10 scale
- Consider project context and triage insights
`;

      // Call Claude API
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      // Extract and parse the response
      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as Anthropic.TextBlock).text)
        .join('\n');
      
      // Use robust parsing method
      const parsedResult = this.parseResponse(responseText);

      // Log the parsed result for debugging
      console.log('🤖 Parsed AI Action Result:', JSON.stringify(parsedResult, null, 2));

      return parsedResult;
    } catch (error) {
      console.error('AI Action Generation Error:', error);
      
      // Fallback result in case of complete failure
      return {
        actions: [{
          domain: 'Product UX',
          description: 'Investigate and improve feature based on user feedback',
          rationale: 'Error in AI action generation',
          riceScoring: {
            reach: 50,
            impact: 5,
            confidence: 70,
            effort: 3,
            priorityScore: 5
          },
          priority: 5
        }],
        fullReasoning: 'Unable to generate detailed actions due to an error',
        keyInsights: ['Action generation failed'],
        potentialChallenges: ['Technical issue with AI service']
      };
    }
  }
}

// Export a singleton instance
export const anthropicActionService = new AnthropicActionService(); 