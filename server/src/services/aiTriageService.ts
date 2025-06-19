import { IInsight } from '../models/Insight';
import { IProject } from '../models/Project';

// Define the structure of AI Triage Result
export interface AITriageResult {
  clarity: 'clear' | 'vague';
  impact: 'core_experience' | 'improve_experience' | 'nice_to_have';
  score: number;
  reasoning: string;
}

export class AITriageService {
  // Mock AI triage method to simulate AI-powered insight evaluation
  static async triageInsight(
    text: string, 
    source: 'user_feedback' | 'team_observation' | 'assumption_idea',
    project?: IProject
  ): Promise<AITriageResult> {
    // Basic text analysis to determine clarity and impact
    const textLength = text.trim().length;
    const wordCount = text.trim().split(/\s+/).length;

    // Determine clarity
    const clarity: AITriageResult['clarity'] = 
      wordCount > 10 && textLength > 50 
        ? 'clear' 
        : 'vague';

    // Determine impact based on source, text, and project context
    const impact: AITriageResult['impact'] = this.determineImpact(text, source, project);

    // Calculate score
    const score = this.calculateTriageScore(clarity, impact, source, project);

    // Generate reasoning
    const reasoning = this.generateTriageReasoning(text, source, clarity, impact, score, project);

    return {
      clarity,
      impact,
      score,
      reasoning
    };
  }

  // Helper method to determine impact with project context
  private static determineImpact(
    text: string, 
    source: 'user_feedback' | 'team_observation' | 'assumption_idea',
    project?: IProject
  ): AITriageResult['impact'] {
    const lowercaseText = text.toLowerCase();

    // Check for keywords indicating core experience impact
    const coreExperienceKeywords = [
      'fundamental', 'critical', 'essential', 'core', 'primary', 'main'
    ];
    const improveExperienceKeywords = [
      'enhance', 'improve', 'optimize', 'refine', 'better', 'smoother'
    ];

    // Incorporate project context if available
    if (project) {
      // Check if insight aligns with project's core features or north star objective
      const projectContext = [
        ...(project.coreFeatures || []),
        project.northStarObjective || '',
        project.valueProposition || ''
      ].join(' ').toLowerCase();

      if (projectContext.split(/\s+/).some(word => lowercaseText.includes(word))) {
        return 'core_experience';
      }
    }

    // Prioritize source and text content
    if (source === 'user_feedback') {
      return coreExperienceKeywords.some(keyword => 
        lowercaseText.includes(keyword)
      ) ? 'core_experience' : 'improve_experience';
    }

    if (source === 'team_observation') {
      return improveExperienceKeywords.some(keyword => 
        lowercaseText.includes(keyword)
      ) ? 'improve_experience' : 'nice_to_have';
    }

    // For assumption/idea, default to nice to have
    return 'nice_to_have';
  }

  // Calculate triage score with project context
  private static calculateTriageScore(
    clarity: AITriageResult['clarity'], 
    impact: AITriageResult['impact'], 
    source: 'user_feedback' | 'team_observation' | 'assumption_idea',
    project?: IProject
  ): number {
    let score = 0;

    // Clarity points
    score += clarity === 'clear' ? 2 : 1;

    // Impact points
    switch (impact) {
      case 'core_experience':
        score += 3;
        break;
      case 'improve_experience':
        score += 2;
        break;
      case 'nice_to_have':
        score += 1;
        break;
    }

    // Source points
    switch (source) {
      case 'user_feedback':
        score += 3;
        break;
      case 'team_observation':
        score += 2;
        break;
      case 'assumption_idea':
        score += 1;
        break;
    }

    // Bonus points for project alignment
    if (project) {
      // Bonus for matching project objectives
      if (project.currentBusinessObjectives?.length) {
        score += 1;
      }

      // Additional bonus for matching core features or north star objective
      if (project.coreFeatures?.length || project.northStarObjective) {
        score += 1;
      }
    }

    return score;
  }

  // Generate human-readable reasoning with project context
  private static generateTriageReasoning(
    text: string, 
    source: 'user_feedback' | 'team_observation' | 'assumption_idea',
    clarity: AITriageResult['clarity'], 
    impact: AITriageResult['impact'], 
    score: number,
    project?: IProject
  ): string {
    const sourceDescriptions = {
      'user_feedback': 'direct user input',
      'team_observation': 'internal team observation',
      'assumption_idea': 'potential improvement idea'
    };

    const impactDescriptions = {
      'core_experience': 'fundamental to user experience',
      'improve_experience': 'can significantly enhance current processes',
      'nice_to_have': 'optional improvement'
    };

    const clarityDescriptions = {
      'clear': 'well-articulated and specific',
      'vague': 'requires further clarification'
    };

    const statusDescription = 
      clarity === 'clear' && score >= 4 
        ? 'Passed triage - high potential value' 
        : clarity === 'vague' && score >= 4 
          ? 'Needs research - promising but requires more details' 
          : 'Rejected - insufficient impact or clarity';

    // Project context reasoning
    let projectContextReasoning = '';
    if (project) {
      projectContextReasoning = `
Project Context:
- Name: ${project.name}
- Value Proposition: ${project.valueProposition || 'Not specified'}
- North Star Objective: ${project.northStarObjective || 'Not specified'}
- Alignment: ${this.assessProjectAlignment(text, project)}`;
    }

    return `Insight Analysis:
- Source: ${sourceDescriptions[source]}
- Clarity: ${clarityDescriptions[clarity]}
- Impact: ${impactDescriptions[impact]}
- Triage Score: ${score}
- Status: ${statusDescription}
${projectContextReasoning}

Recommendation: ${this.generateRecommendation(text, source, clarity, impact, score, project)}`;
  }

  // Assess alignment with project context
  private static assessProjectAlignment(text: string, project: IProject): string {
    const lowercaseText = text.toLowerCase();
    const projectContext = [
      project.name.toLowerCase(),
      project.valueProposition?.toLowerCase() || '',
      project.northStarObjective?.toLowerCase() || '',
      ...(project.coreFeatures || []).map(f => f.toLowerCase()),
      ...(project.currentBusinessObjectives || []).map(o => o.toLowerCase())
    ];

    const matchedContexts = projectContext.filter(context => 
      context && lowercaseText.includes(context)
    );

    if (matchedContexts.length > 2) return 'Strong Alignment';
    if (matchedContexts.length > 0) return 'Partial Alignment';
    return 'Limited Alignment';
  }

  // Generate specific recommendation with project context
  private static generateRecommendation(
    text: string, 
    source: 'user_feedback' | 'team_observation' | 'assumption_idea',
    clarity: AITriageResult['clarity'], 
    impact: AITriageResult['impact'], 
    score: number,
    project?: IProject
  ): string {
    if (clarity === 'clear' && score >= 4) {
      return project 
        ? `Proceed with detailed analysis aligned with project "${project.name}".` 
        : 'Proceed with detailed analysis and potential implementation.';
    }

    if (clarity === 'vague' && score >= 4) {
      return project
        ? `Gather more context specific to project "${project.name}" before making a decision.`
        : 'Gather more context and details before making a decision.';
    }

    return 'Consider refining the insight or exploring alternative approaches.';
  }
}

export default AITriageService; 