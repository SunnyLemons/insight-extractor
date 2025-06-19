import { IInsight } from '../models/Insight';
import { IAction } from '../models/Action';
import { IProject } from '../models/Project';

// Define the structure of AI Action Generation Result
export interface AIActionResult {
  description: string;
  
  // RICE Scoring
  reach: number; // 0-100 scale of users potentially reached
  impact: 1 | 2 | 3; // 1-low, 2-medium, 3-high impact
  confidence: number; // 0-100% confidence score
  effort: 1 | 2 | 3; // 1-low, 2-medium, 3-high effort
  
  // New data points
  categoryArea?: string;

  // Add missing properties for actionRoutes
  priority: number;
  estimatedEffort: number;
  potentialImpact: number;
}

export class AIActionService {
  // Calculate priority based on RICE scoring
  private static calculatePriority(reach: number, impact: number, confidence: number, effort: number): number {
    // RICE score calculation: (Reach * Impact * Confidence) / Effort
    const riceScore = (reach * impact * confidence) / effort;
    
    // Normalize to a 0-10 scale
    return Math.min(10, Math.max(0, Math.round(riceScore / 10)));
  }

  // Estimate effort based on impact and complexity
  private static calculateEstimatedEffort(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): number {
    const effortMap = {
      'core_experience': 3,
      'improve_experience': 2,
      'nice_to_have': 1
    };

    // Adjust effort based on project context
    let baseEffort = effortMap[insight.impact] || 2;
    
    if (project) {
      // Increase effort for complex projects or high-stakes objectives
      if (project.northStarObjective) baseEffort += 1;
      
      // Adjust based on current business objectives
      if (project.currentBusinessObjectives?.length) {
        baseEffort += 0.5;
      }
    }

    return Math.min(3, Math.max(1, Math.round(baseEffort)));
  }

  // Calculate potential impact score
  private static calculatePotentialImpact(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): number {
    const impactMap = {
      'core_experience': 9,
      'improve_experience': 6,
      'nice_to_have': 3
    };
    
    let baseImpact = impactMap[insight.impact] || 5;

    // Boost impact for project-aligned insights
    if (project) {
      // Strong alignment with project objectives
      if (project.northStarObjective) baseImpact += 2;
      
      // Additional boost for matching core features
      if (project.coreFeatures?.length) baseImpact += 1;
    }

    return Math.min(10, baseImpact);
  }

  // Generate action from insight using AI-like reasoning
  static async generateActionFromInsight(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): Promise<AIActionResult> {
    // Generate action description
    const description = this.generateActionDescription(insight, project);
    
    // Determine RICE scoring
    const reach = this.calculateReach(insight, project);
    const impact = this.determineImpact(insight, project);
    const confidence = this.calculateConfidence(insight, project);
    const effort = this.calculateEffort(insight, project);
    
    // Generate category area
    const categoryArea = this.generateCategoryArea(insight, project);

    // Calculate additional properties
    const priority = this.calculatePriority(reach, impact, confidence, effort);
    const estimatedEffort = this.calculateEstimatedEffort(insight, project);
    const potentialImpact = this.calculatePotentialImpact(insight, project);

    return {
      description,
      reach,
      impact,
      confidence,
      effort,
      categoryArea,
      priority,
      estimatedEffort,
      potentialImpact
    };
  }

  // Define type for domain action generators
  private static domainActionGenerators: {
    [key: string]: {
      keywords: string[];
      actionTemplates: string[];
    }
  } = {
    // Product (UI/UX) Domain
    product: {
      keywords: [
        'interface', 'design', 'user experience', 'usability', 'layout', 
        'interaction', 'visual', 'prototype', 'wireframe', 'navigation'
      ],
      actionTemplates: [
        'Redesign {domain} interface to improve user engagement',
        'Optimize {domain} user flow and interaction patterns',
        'Conduct comprehensive UX audit for {domain} experience',
        'Develop more intuitive navigation for {domain} features',
        'Create user-centric design improvements for {domain}'
      ]
    },
    
    // Service Domain
    service: {
      keywords: [
        'support', 'customer', 'onboarding', 'training', 'help', 
        'assistance', 'guidance', 'resolution', 'communication'
      ],
      actionTemplates: [
        'Enhance {domain} customer onboarding process',
        'Develop comprehensive support strategy for {domain}',
        'Create advanced customer assistance workflow',
        'Improve service communication and responsiveness',
        'Design proactive customer support mechanisms'
      ]
    },
    
    // Marketing Communications Domain
    marketing: {
      keywords: [
        'messaging', 'brand', 'communication', 'positioning', 
        'value proposition', 'storytelling', 'audience', 'campaign'
      ],
      actionTemplates: [
        'Refine {domain} brand messaging and positioning',
        'Develop targeted communication strategy for {domain}',
        'Create compelling narrative for {domain} value proposition',
        'Design audience-specific marketing approach',
        'Optimize brand communication channels'
      ]
    },
    
    // Technology Domain
    technology: {
      keywords: [
        'performance', 'scalability', 'architecture', 'infrastructure', 
        'integration', 'security', 'optimization', 'tech stack', 
        'backend', 'frontend', 'cloud', 'api'
      ],
      actionTemplates: [
        'Improve {domain} system performance and scalability',
        'Enhance technological infrastructure for {domain}',
        'Develop robust integration strategy',
        'Implement advanced security protocols',
        'Optimize technical architecture and ecosystem'
      ]
    },
    
    // Operations Domain
    operations: {
      keywords: [
        'process', 'efficiency', 'workflow', 'automation', 
        'productivity', 'streamline', 'optimization', 'management'
      ],
      actionTemplates: [
        'Streamline {domain} operational workflows',
        'Develop process automation strategy',
        'Improve operational efficiency and productivity',
        'Create comprehensive operational optimization plan',
        'Implement advanced workflow management techniques'
      ]
    },
    
    // Strategy Domain
    strategy: {
      keywords: [
        'vision', 'direction', 'roadmap', 'growth', 'expansion', 
        'market', 'competitive', 'long-term', 'objective', 'goal'
      ],
      actionTemplates: [
        'Develop strategic roadmap for {domain} growth',
        'Create comprehensive market expansion strategy',
        'Define long-term vision and competitive positioning',
        'Align business objectives with market opportunities',
        'Design strategic framework for sustainable development'
      ]
    }
  };

  // Advanced key phrase extraction with context-aware processing
  private static extractKeyPhrases(text: string): { domain: string, action: string }[] {
    // Convert to lowercase and remove punctuation
    const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    
    const matchedDomains: { domain: string, action: string }[] = [];

    // Check each domain for potential matches
    Object.entries(this.domainActionGenerators).forEach(([domainName, domainConfig]) => {
      // Check if any keyword from the domain matches the text
      const matchedKeywords = domainConfig.keywords.filter(keyword => 
        new RegExp(`\\b${keyword}\\w*\\b`, 'i').test(cleanText)
      );

      // If keywords match, generate an action
      if (matchedKeywords.length > 0) {
        // Randomly select an action template
        const actionTemplate = domainConfig.actionTemplates[
          Math.floor(Math.random() * domainConfig.actionTemplates.length)
        ];
        
        // Replace {domain} placeholder with a generic or specific domain name
        const action = actionTemplate.replace('{domain}', 'project');
        
        matchedDomains.push({ 
          domain: domainName, 
          action: action 
        });
      }
    });

    // Fallback to multiple domains if no specific match
    if (matchedDomains.length === 0) {
      // Select 1-3 random domains
      const fallbackDomains = Object.keys(this.domainActionGenerators)
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);
      
      fallbackDomains.forEach(domainName => {
        const domainConfig = this.domainActionGenerators[domainName];
        const actionTemplate = domainConfig.actionTemplates[
          Math.floor(Math.random() * domainConfig.actionTemplates.length)
        ];
        
        matchedDomains.push({ 
          domain: domainName, 
          action: actionTemplate.replace('{domain}', 'project') 
        });
      });
    }

    // Extensive logging for debugging
    console.log('🔍 Original Insight Text:', text);
    console.log('🧠 Matched Domains:', matchedDomains);

    return matchedDomains;
  }

  // Generate descriptive action based on insight text and project context
  private static generateActionDescription(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): string {
    const sourceDescriptions = {
      'user_feedback': 'Address user-reported',
      'team_observation': 'Implement team-identified',
      'assumption_idea': 'Explore potential'
    };

    const impactDescriptions = {
      'core_experience': 'critical improvement for',
      'improve_experience': 'enhancement to',
      'nice_to_have': 'optimization of'
    };

    // Extract key phrases with advanced context
    const keyPhrases = this.extractKeyPhrases(insight.text);

    // Incorporate project context if available
    const projectContext = project 
      ? ` for ${project.name} project` 
      : '';

    // Combine elements with more natural language
    const actionDescriptions = keyPhrases.map(phrase => 
      `${sourceDescriptions[insight.source]} ${impactDescriptions[insight.impact]} ${phrase.action}${projectContext}`.trim()
    );

    // Additional logging
    console.log('📝 Final Action Descriptions:', actionDescriptions);

    // Return the first action description or join multiple if generated
    return actionDescriptions.join('; ');
  }

  // Calculate reach based on insight and project characteristics
  private static calculateReach(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): number {
    // Reach calculation logic
    const baseReach = {
      'user_feedback': 80,
      'team_observation': 50,
      'assumption_idea': 30
    };

    const clarityMultiplier = insight.clarity === 'clear' ? 1.2 : 0.8;

    // Boost reach for project-aligned insights
    let projectMultiplier = 1;
    if (project) {
      // Increase reach for insights aligned with core features or objectives
      if (project.northStarObjective) projectMultiplier += 0.2;
      if (project.coreFeatures?.length) projectMultiplier += 0.1;
    }

    return Math.min(100, Math.round(
      baseReach[insight.source] * clarityMultiplier * projectMultiplier
    ));
  }

  // Determine impact score with project context
  private static determineImpact(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): 1 | 2 | 3 {
    const impactMapping = {
      'core_experience': 3,
      'improve_experience': 2,
      'nice_to_have': 1
    };

    let baseImpact = impactMapping[insight.impact] as 1 | 2 | 3;

    // Boost impact for project-aligned insights
    if (project) {
      if (project.northStarObjective) baseImpact = 3 as 1 | 2 | 3;
      if (project.coreFeatures?.length) baseImpact = Math.max(2, baseImpact) as 1 | 2 | 3;
    }

    return baseImpact;
  }

  // Calculate confidence based on insight, project context
  private static calculateConfidence(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): number {
    const baseConfidence = {
      'user_feedback': 90,
      'team_observation': 75,
      'assumption_idea': 50
    };

    const clarityMultiplier = insight.clarity === 'clear' ? 1.2 : 0.8;

    // Boost confidence for project-aligned insights
    let projectMultiplier = 1;
    if (project) {
      // Increase confidence for insights aligned with project objectives
      if (project.northStarObjective) projectMultiplier += 0.2;
      if (project.coreFeatures?.length) projectMultiplier += 0.1;
    }

    return Math.min(100, Math.round(
      baseConfidence[insight.source] * clarityMultiplier * projectMultiplier
    ));
  }

  // Calculate effort based on insight complexity and project context
  private static calculateEffort(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): 1 | 2 | 3 {
    const effortMapping = {
      'core_experience': 3,
      'improve_experience': 2,
      'nice_to_have': 1
    };

    let baseEffort = effortMapping[insight.impact] as 1 | 2 | 3;

    // Adjust effort based on project complexity
    if (project) {
      // Increase effort for complex projects or high-stakes objectives
      if (project.northStarObjective) baseEffort = Math.min(3, baseEffort + 1) as 1 | 2 | 3;
      
      // Adjust based on current business objectives
      if (project.currentBusinessObjectives?.length) {
        baseEffort = Math.min(3, baseEffort + 1) as 1 | 2 | 3;
      }
    }

    return baseEffort;
  }

  // Generate category area with more specific categorization
  private static generateCategoryArea(
    insight: IInsight, 
    project?: Pick<IProject, 'name' | 'details' | 'northStarObjective' | 'coreFeatures' | 'valueProposition' | 'currentBusinessObjectives'>
  ): string {
    // Define category mapping based on insight characteristics
    const categoryMap = {
      'user_feedback': [
        'User Experience',
        'Product Improvement',
        'Customer Satisfaction',
        'Feature Enhancement'
      ],
      'team_observation': [
        'Internal Process',
        'Product Strategy',
        'Technical Optimization',
        'Team Efficiency'
      ],
      'assumption_idea': [
        'Innovation',
        'Future Development',
        'Strategic Planning',
        'Exploratory Initiative'
      ]
    };

    // Project-specific category boost
    const projectCategories = project ? [
      ...(project.northStarObjective ? ['Strategic Alignment'] : []),
      ...(project.coreFeatures?.length ? ['Core Feature Development'] : [])
    ] : [];

    // Select categories
    const baseCategoryOptions = categoryMap[insight.source];
    const combinedCategories = [...baseCategoryOptions, ...projectCategories];

    // Randomly select a category with bias towards project-specific ones
    return combinedCategories[Math.floor(Math.random() * combinedCategories.length)];
  }
}

export default AIActionService; 