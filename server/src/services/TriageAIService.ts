import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Define the triage scoring interface with more detailed attributes
export interface TriageResult {
  clarity: 'clear' | 'vague';
  impact: 'core_experience' | 'improve_experience' | 'nice_to_have';
  explanation: string;
  score: number;
  triageStatus: 'passed' | 'research_needed' | 'rejected';
  
  // New detailed attributes for more nuanced scoring
  contextualRelevance: number; // 0-100 scale of how relevant the insight is
  innovationPotential: number; // 0-100 scale of potential for innovative solution
  urgency: number; // 0-100 scale of how time-sensitive the insight is
  userSentiment: 'positive' | 'neutral' | 'negative'; // Emotional tone of the insight
  
  // Specific domain and feature tags
  primaryDomain?: string;
  affectedFeatures?: string[];
}

export interface IInsight extends mongoose.Document {
  // Existing fields...
  contextualRelevance?: number;
  innovationPotential?: number;
  urgency?: number;
  userSentiment?: 'positive' | 'neutral' | 'negative';
  primaryDomain?: string;
  affectedFeatures?: string[];
}

export class TriageAIService {
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

  async performTriageScoring(
    insightText: string, 
    source: 'user_feedback' | 'team_observation' | 'assumption_idea'
  ): Promise<TriageResult> {
    try {
      // Construct more comprehensive prompt for Claude
      const prompt = `
        You are an AI assistant performing advanced insight triage for a parenting support application.

        Analyze the following insight with extreme precision:

        Insight Source: ${source}
        Insight Description: ${insightText}

        Provide a comprehensive triage assessment focusing on:
        1. Clarity of the insight (clear or vague)
        2. Impact level (core user experience, improve experience, or nice to have)
        3. Contextual Relevance (how directly this impacts the core user journey)
        4. Innovation Potential (how novel the insight is)
        5. Urgency (time-sensitivity of addressing this insight)
        6. User Sentiment (emotional tone of the feedback)
        7. Primary Domain and Affected Features

        Scoring Guidelines:
        - Clarity: Based on specificity, completeness of information
        - Impact: Evaluate potential transformation of user experience
        - Contextual Relevance: Alignment with core product goals
        - Innovation Potential: Uniqueness of the proposed improvement
        - Urgency: Immediate vs. long-term need
        - User Sentiment: Emotional undertone of the feedback

        Respond in strict JSON format with detailed scoring:
        {
          "clarity": "clear|vague",
          "impact": "core_experience|improve_experience|nice_to_have",
          "explanation": "Detailed reasoning...",
          "score": number,
          "triageStatus": "passed|research_needed|rejected",
          "contextualRelevance": number,
          "innovationPotential": number,
          "urgency": number,
          "userSentiment": "positive|neutral|negative",
          "primaryDomain": "string",
          "affectedFeatures": ["string"]
        }

        Be precise, analytical, and provide nuanced insights.
      `;

      // Call Claude API
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      // Extract response text
      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as Anthropic.TextBlock).text)
        .join('\n');
      
      // Attempt to parse the JSON
      try {
        const parsedResult: TriageResult = JSON.parse(responseText);
        
        // Additional validation and normalization
        parsedResult.contextualRelevance = Math.min(100, Math.max(0, parsedResult.contextualRelevance || 50));
        parsedResult.innovationPotential = Math.min(100, Math.max(0, parsedResult.innovationPotential || 50));
        parsedResult.urgency = Math.min(100, Math.max(0, parsedResult.urgency || 50));

        return parsedResult;
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        
        // Fallback result
        return {
          clarity: 'vague',
          impact: 'nice_to_have',
          explanation: 'Unable to parse detailed AI assessment',
          score: 2,
          triageStatus: 'research_needed',
          contextualRelevance: 50,
          innovationPotential: 50,
          urgency: 50,
          userSentiment: 'neutral',
          primaryDomain: 'General',
          affectedFeatures: []
        };
      }
    } catch (error) {
      console.error('AI Triage Scoring Error:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Detailed Error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      // Fallback result in case of complete failure
      return {
        clarity: 'vague',
        impact: 'nice_to_have',
        explanation: `Error in AI triage assessment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        score: 2,
        triageStatus: 'research_needed',
        contextualRelevance: 50,
        innovationPotential: 50,
        urgency: 50,
        userSentiment: 'neutral',
        primaryDomain: 'General',
        affectedFeatures: []
      };
    }
  }
}

// Export a singleton instance
export const triageAIService = new TriageAIService(); 