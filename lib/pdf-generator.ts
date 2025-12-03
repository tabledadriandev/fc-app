import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

interface Assessment {
  goal: string
  challenges: string
  lifestyle: string
  dietary: string
  conditions?: string
}

/**
 * Generate personalized wellness PDF based on assessment
 */
export async function generateWellnessPDF(assessment: Assessment): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    })

    const buffers: Buffer[] = []

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
    doc.on('error', reject)

    // PAGE 1: Personalized Assessment
    doc.fontSize(24).text('Table d\'Adrian', { align: 'center' })
    doc.moveDown()
    doc.fontSize(18).text('Personalized Wellness Plan', { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(12)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' })
    doc.moveDown(2)

    doc.fontSize(14).font('Helvetica-Bold').text('YOUR STATED GOAL:')
    doc.font('Helvetica').fontSize(12)
    doc.text(assessment.goal, { indent: 20 })
    doc.moveDown()

    doc.fontSize(14).font('Helvetica-Bold').text('YOUR CHALLENGES:')
    doc.font('Helvetica').fontSize(12)
    doc.text(assessment.challenges, { indent: 20 })
    doc.moveDown()

    doc.fontSize(14).font('Helvetica-Bold').text('LIFESTYLE:')
    doc.font('Helvetica').fontSize(12)
    doc.text(assessment.lifestyle, { indent: 20 })
    doc.moveDown()

    doc.fontSize(14).font('Helvetica-Bold').text('DIETARY PROFILE:')
    doc.font('Helvetica').fontSize(12)
    doc.text(assessment.dietary, { indent: 20 })
    doc.moveDown()

    if (assessment.conditions) {
      doc.fontSize(14).font('Helvetica-Bold').text('CONDITIONS TO ADDRESS:')
      doc.font('Helvetica').fontSize(12)
      doc.text(assessment.conditions, { indent: 20 })
      doc.moveDown()
    }

    doc.moveDown()
    doc.fontSize(10).font('Helvetica-Oblique')
    doc.text('This plan is confidential and customized for you', { align: 'center' })

    // PAGE 2: Problem Analysis & Recommendations
    doc.addPage()
    doc.fontSize(20).font('Helvetica-Bold').text('Problem Analysis & Recommendations')
    doc.moveDown()

    doc.fontSize(12).font('Helvetica')
    doc.text('Why this affects you:', { continued: false })
    doc.moveDown(0.5)
    doc.text(
      generateProblemAnalysis(assessment.goal, assessment.challenges),
      { indent: 20, align: 'justify' }
    )
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Science behind it:')
    doc.font('Helvetica')
    doc.text(
      'This protocol is based on evidence from the Biohackers Handbook and Table d\'Adrian\'s nutritional research. The recommendations are tailored to address your specific wellness goals through targeted nutrition, lifestyle modifications, and strategic supplementation.',
      { indent: 20, align: 'justify' }
    )
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Immediate actions:')
    doc.font('Helvetica')
    const immediateActions = generateImmediateActions(assessment)
    immediateActions.forEach((action) => {
      doc.text(`• ${action}`, { indent: 20 })
    })
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Timeline:')
    doc.font('Helvetica')
    doc.text('You\'ll feel improvements by Week 2, with significant changes visible by Week 4.', {
      indent: 20,
    })

    // PAGE 3: 30-Day Nutrition Protocol
    doc.addPage()
    doc.fontSize(20).font('Helvetica-Bold').text('Your 30-Day Nutrition Protocol')
    doc.moveDown()

    const nutritionProtocol = generateNutritionProtocol(assessment)
    doc.fontSize(12).font('Helvetica')
    doc.text('Daily macro targets:', { continued: false })
    doc.moveDown(0.5)
    nutritionProtocol.macroTargets.forEach((target) => {
      doc.text(`• ${target}`, { indent: 20 })
    })
    doc.moveDown()

    doc.text('Meal timing framework:', { continued: false })
    doc.moveDown(0.5)
    doc.text(nutritionProtocol.mealTiming, { indent: 20 })
    doc.moveDown()

    doc.text('Foods to emphasize:', { continued: false })
    doc.moveDown(0.5)
    nutritionProtocol.foodsToEmphasize.forEach((food) => {
      doc.text(`• ${food}`, { indent: 20 })
    })
    doc.moveDown()

    doc.text('Foods to avoid:', { continued: false })
    doc.moveDown(0.5)
    nutritionProtocol.foodsToAvoid.forEach((food) => {
      doc.text(`• ${food}`, { indent: 20 })
    })
    doc.moveDown()

    doc.text('Daily sample meal structure:', { continued: false })
    doc.moveDown(0.5)
    doc.text(nutritionProtocol.sampleMealStructure, { indent: 20 })

    // PAGE 4: Recipes
    doc.addPage()
    doc.fontSize(20).font('Helvetica-Bold').text('Recipes')
    doc.moveDown()

    const recipes = generateRecipes(assessment)
    recipes.forEach((recipe, index) => {
      if (index > 0) doc.moveDown(2)
      doc.fontSize(16).font('Helvetica-Bold').text(recipe.title)
      doc.moveDown(0.5)
      doc.fontSize(12).font('Helvetica-Bold').text('Ingredients:')
      doc.font('Helvetica')
      recipe.ingredients.forEach((ing) => {
        doc.text(`• ${ing}`, { indent: 20 })
      })
      doc.moveDown(0.5)
      doc.font('Helvetica-Bold').text('Method:')
      doc.font('Helvetica')
      doc.text(recipe.method, { indent: 20, align: 'justify' })
      doc.moveDown(0.5)
      doc.font('Helvetica-Bold').text('Nutrition facts:')
      doc.font('Helvetica')
      doc.text(recipe.nutrition, { indent: 20 })
      if (recipe.tcmBenefits) {
        doc.moveDown(0.5)
        doc.font('Helvetica-Bold').text('TCM benefits:')
        doc.font('Helvetica')
        doc.text(recipe.tcmBenefits, { indent: 20 })
      }
    })

    // PAGE 5: Supplement & Nutrient Protocol
    doc.addPage()
    doc.fontSize(20).font('Helvetica-Bold').text('Supplement & Nutrient Protocol')
    doc.moveDown()

    const supplements = generateSupplements(assessment)
    doc.fontSize(14).font('Helvetica-Bold').text('Core Supplements:')
    doc.moveDown(0.5)
    doc.fontSize(12).font('Helvetica')
    supplements.forEach((supp) => {
      doc.font('Helvetica-Bold').text(supp.name)
      doc.font('Helvetica')
      doc.text(`Dosage: ${supp.dosage}`, { indent: 20 })
      doc.text(`Timing: ${supp.timing}`, { indent: 20 })
      doc.text(`Why: ${supp.why}`, { indent: 20 })
      doc.moveDown()
    })

    if (assessment.conditions) {
      doc.moveDown()
      doc.fontSize(14).font('Helvetica-Bold').text('Drug-Nutrient Interactions:')
      doc.font('Helvetica').fontSize(12)
      doc.text(
        'Please consult with your healthcare provider before starting any new supplements, especially if you have existing health conditions or are taking medications.',
        { indent: 20, align: 'justify' }
      )
    }

    doc.moveDown()
    doc.font('Helvetica-Bold').text('Supplement Timing Chart:')
    doc.font('Helvetica')
    doc.text('Morning: Take with breakfast', { indent: 20 })
    doc.text('Evening: Take with dinner', { indent: 20 })
    doc.moveDown()
    doc.text('Start slow, increase over 1 week', { align: 'center', font: 'Helvetica-Oblique' })

    // PAGE 6: 30-Day Meal Plan
    doc.addPage()
    doc.fontSize(20).font('Helvetica-Bold').text('30-Day Meal Plan')
    doc.moveDown()

    const mealPlan = generateMealPlan(assessment)
    mealPlan.weeks.forEach((week, index) => {
      doc.fontSize(14).font('Helvetica-Bold').text(`Week ${index + 1}:`)
      doc.font('Helvetica').fontSize(12)
      doc.text(week.structure, { indent: 20 })
      doc.moveDown()
    })

    doc.moveDown()
    doc.font('Helvetica-Bold').text('Shopping List:')
    doc.font('Helvetica')
    mealPlan.shoppingList.forEach((item) => {
      doc.text(`• ${item}`, { indent: 20 })
    })

    // PAGE 7: Lifestyle + Stress Protocol
    doc.addPage()
    doc.fontSize(20).font('Helvetica-Bold').text('Lifestyle + Stress Protocol')
    doc.moveDown()

    const lifestyle = generateLifestyleProtocol(assessment)
    doc.fontSize(14).font('Helvetica-Bold').text('Sleep optimization:')
    doc.font('Helvetica').fontSize(12)
    doc.text(lifestyle.sleep, { indent: 20, align: 'justify' })
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Exercise protocol:')
    doc.font('Helvetica')
    doc.text(lifestyle.exercise, { indent: 20, align: 'justify' })
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Stress management techniques:')
    doc.font('Helvetica')
    lifestyle.stressManagement.forEach((technique) => {
      doc.text(`• ${technique}`, { indent: 20 })
    })
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Daily routine template:')
    doc.font('Helvetica')
    doc.text(lifestyle.dailyRoutine, { indent: 20 })

    // PAGE 8: FAQ + Troubleshooting
    doc.addPage()
    doc.fontSize(20).font('Helvetica-Bold').text('FAQ + Troubleshooting')
    doc.moveDown()

    const faqs = [
      {
        q: 'What if I\'m still hungry?',
        a: 'Increase protein and healthy fats. Ensure you\'re eating enough calories for your activity level.',
      },
      {
        q: 'Can I swap ingredients?',
        a: 'Yes, but maintain similar macronutrient profiles. Consult the foods to emphasize list for alternatives.',
      },
      {
        q: 'How do I eat out?',
        a: 'Choose restaurants with whole food options. Prioritize protein and vegetables, avoid processed foods.',
      },
      {
        q: 'What if I feel worse?',
        a: 'This can be normal during adaptation. If symptoms persist beyond Week 2, reduce supplement dosages and consult your healthcare provider.',
      },
      {
        q: 'When should I expect results?',
        a: 'Initial improvements typically appear by Week 2, with significant changes by Week 4.',
      },
      {
        q: 'How to track progress?',
        a: 'Keep a daily journal of energy levels, sleep quality, mood, and any symptoms. Review weekly.',
      },
    ]

    doc.fontSize(12).font('Helvetica')
    faqs.forEach((faq) => {
      doc.font('Helvetica-Bold').text(faq.q)
      doc.font('Helvetica')
      doc.text(faq.a, { indent: 20, align: 'justify' })
      doc.moveDown()
    })

    // Back Cover
    doc.addPage()
    doc.fontSize(16).font('Helvetica-Bold').text('Table d\'Adrian', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).font('Helvetica')
    doc.text('This plan is based on Table d\'Adrian\'s nutritional protocols', { align: 'center' })
    doc.moveDown()
    doc.text(`Generated ${new Date().toLocaleDateString()} | Valid for 30 days`, {
      align: 'center',
    })
    doc.moveDown()
    doc.text('Questions? Follow @tabledadrian on Farcaster', { align: 'center' })
    doc.moveDown(3)
    doc.fontSize(10).font('Helvetica-Oblique')
    doc.text('Table d\'Adrian | Premium Longevity & Wellness Collective', {
      align: 'center',
    })

    doc.end()
  })
}

// Helper functions to generate personalized content
function generateProblemAnalysis(goal: string, challenges: string): string {
  // This is a simplified version - in production, use AI (GPT-4/Claude) for personalized analysis
  return `Based on your stated goal of "${goal}" and current challenges including "${challenges}", this protocol addresses the root causes through targeted nutritional interventions, lifestyle modifications, and strategic supplementation. The approach is designed to support your body's natural healing processes while addressing specific imbalances.`
}

function generateImmediateActions(assessment: Assessment): string[] {
  const actions = [
    'Start with the core supplement protocol (begin with half doses)',
    'Implement the meal timing framework immediately',
    'Remove foods to avoid from your diet',
    'Begin tracking your daily intake and symptoms',
  ]

  if (assessment.lifestyle.includes('Sedentary')) {
    actions.push('Incorporate light movement daily (10-15 minutes)')
  }

  if (assessment.challenges.toLowerCase().includes('stress')) {
    actions.push('Practice stress management techniques twice daily')
  }

  return actions
}

function generateNutritionProtocol(assessment: Assessment) {
  const isActive = assessment.lifestyle.includes('active') || assessment.lifestyle.includes('Athlete')
  const isVegan = assessment.dietary.toLowerCase().includes('vegan')
  const isKeto = assessment.dietary.toLowerCase().includes('keto')

  const macroTargets = isActive
    ? [
        'Protein: 1.6-2.0g per kg body weight',
        'Carbs: 4-6g per kg body weight',
        'Fats: 0.8-1.2g per kg body weight',
        'Iron: 18-27mg daily',
        'Zinc: 11-15mg daily',
      ]
    : [
        'Protein: 1.2-1.6g per kg body weight',
        'Carbs: 3-4g per kg body weight',
        'Fats: 0.6-1.0g per kg body weight',
        'Iron: 15-18mg daily',
        'Zinc: 8-11mg daily',
      ]

  const foodsToEmphasize = isVegan
    ? [
        'Lentils and legumes',
        'Quinoa and amaranth',
        'Dark leafy greens',
        'Nuts and seeds',
        'Sea vegetables',
        'Fermented foods',
      ]
    : [
        'Grass-fed meats',
        'Wild-caught fish',
        'Pasture-raised eggs',
        'Dark leafy greens',
        'Root vegetables',
        'Bone broth',
      ]

  const foodsToAvoid = [
    'Processed foods',
    'Refined sugars',
    'Industrial seed oils',
  ]

  if (assessment.dietary.toLowerCase().includes('gluten')) {
    foodsToAvoid.push('Gluten-containing grains')
  }

  if (assessment.dietary.toLowerCase().includes('dairy')) {
    foodsToAvoid.push('Dairy products')
  }

  return {
    macroTargets,
    mealTiming:
      'Breakfast within 1 hour of waking, lunch 4-5 hours later, dinner 4-5 hours after lunch. Finish eating 3 hours before bedtime.',
    foodsToEmphasize,
    foodsToAvoid,
    sampleMealStructure:
      'Breakfast: Protein + healthy fats + vegetables | Lunch: Protein + complex carbs + vegetables | Dinner: Protein + vegetables + optional small portion of carbs',
  }
}

function generateRecipes(assessment: Assessment) {
  const isVegan = assessment.dietary.toLowerCase().includes('vegan')
  const goal = assessment.goal.toLowerCase()

  const recipes = []

  if (goal.includes('energy') || goal.includes('dhea')) {
    recipes.push({
      title: 'Iron-Rich Power Bowl',
      ingredients: [
        '200g grass-fed beef (or 150g lentils for vegan)',
        '100g spinach',
        '50g quinoa',
        '1 tbsp pumpkin seeds',
        '1 tbsp olive oil',
        'Lemon juice',
      ],
      method:
        'Cook protein source. Steam spinach. Combine quinoa with protein and spinach. Top with seeds and olive oil. Drizzle with lemon.',
      nutrition: 'Calories: 450 | Protein: 35g | Iron: 12mg | Zinc: 8mg',
      tcmBenefits: 'Builds blood, tonifies Qi, supports energy production',
    })
  }

  if (goal.includes('sleep') || goal.includes('stress')) {
    recipes.push({
      title: 'Magnesium-Rich Evening Meal',
      ingredients: [
        '150g wild-caught salmon (or 100g tempeh for vegan)',
        '200g sweet potato',
        '100g dark leafy greens',
        '1 tbsp tahini',
        'Herbs: rosemary, thyme',
      ],
      method:
        'Bake salmon/tempeh with herbs. Roast sweet potato. Sauté greens. Serve together with tahini drizzle.',
      nutrition: 'Calories: 420 | Protein: 30g | Magnesium: 120mg | Omega-3: 2g',
      tcmBenefits: 'Calms the mind, nourishes Yin, supports restful sleep',
    })
  }

  recipes.push({
    title: 'Gut-Healing Bone Broth Soup',
    ingredients: [
      '500ml bone broth (or vegetable broth for vegan)',
      '100g chicken (or chickpeas)',
      '50g carrots',
      '50g celery',
      '50g zucchini',
      'Ginger, turmeric, sea salt',
    ],
    method:
      'Simmer broth with vegetables and spices for 20 minutes. Add protein and cook until done. Season to taste.',
    nutrition: 'Calories: 280 | Protein: 25g | Collagen: 10g | Anti-inflammatory compounds',
    tcmBenefits: 'Strengthens Spleen, supports digestion, builds Qi',
  })

  return recipes
}

function generateSupplements(assessment: Assessment) {
  const supplements = []
  const goal = assessment.goal.toLowerCase()
  const challenges = assessment.challenges.toLowerCase()

  if (goal.includes('energy') || goal.includes('dhea') || challenges.includes('fatigue')) {
    supplements.push({
      name: 'Iron Bisglycinate',
      dosage: '18-27mg daily',
      timing: 'Morning with food',
      why: 'Supports energy production and oxygen transport. Bisglycinate form is gentle on the stomach.',
    })

    supplements.push({
      name: 'B-Complex',
      dosage: '1 capsule daily',
      timing: 'Morning with breakfast',
      why: 'Essential for energy metabolism and adrenal function.',
    })
  }

  if (challenges.includes('stress') || challenges.includes('sleep')) {
    supplements.push({
      name: 'Magnesium Glycinate',
      dosage: '400-600mg daily',
      timing: 'Evening before bed',
      why: 'Calms nervous system, supports sleep quality, and muscle relaxation.',
    })
  }

  if (goal.includes('hormon') || challenges.includes('hormon')) {
    supplements.push({
      name: 'Zinc Picolinate',
      dosage: '15-30mg daily',
      timing: 'Morning with food',
      why: 'Supports hormonal balance and immune function.',
    })
  }

  supplements.push({
    name: 'Vitamin D3 + K2',
    dosage: '2000-5000 IU daily',
    timing: 'Morning with fat-containing meal',
    why: 'Supports immune function, bone health, and overall wellness.',
  })

  supplements.push({
    name: 'Omega-3 (EPA/DHA)',
    dosage: '1000-2000mg daily',
    timing: 'Evening with dinner',
    why: 'Anti-inflammatory, supports brain health and cardiovascular function.',
  })

  return supplements
}

function generateMealPlan(assessment: Assessment) {
  return {
    weeks: [
      {
        structure:
          'Week 1: Focus on establishing meal timing and removing foods to avoid. Begin with core supplements at half dose.',
      },
      {
        structure:
          'Week 2: Increase protein intake. Add in recipes from protocol. Full supplement dosage.',
      },
      {
        structure:
          'Week 3: Optimize meal timing. Fine-tune portions based on energy levels. Continue protocol.',
      },
      {
        structure:
          'Week 4: Maintain protocol. Assess progress. Adjust as needed based on results.',
      },
    ],
    shoppingList: [
      'Grass-fed meats or plant proteins',
      'Dark leafy greens (spinach, kale, chard)',
      'Root vegetables (sweet potato, carrots)',
      'Quinoa or amaranth',
      'Nuts and seeds',
      'Olive oil and coconut oil',
      'Bone broth or vegetable broth',
      'Fresh herbs (rosemary, thyme, ginger)',
      'Fermented foods (sauerkraut, kimchi)',
      'Wild-caught fish (if not vegan)',
    ],
  }
}

function generateLifestyleProtocol(assessment: Assessment) {
  const isActive = assessment.lifestyle.includes('active') || assessment.lifestyle.includes('Athlete')

  return {
    sleep: isActive
      ? 'Aim for 7-9 hours. Maintain consistent sleep schedule. Avoid screens 1 hour before bed. Keep room cool and dark.'
      : 'Aim for 8-9 hours. Establish bedtime routine. Reduce evening stimulation. Support circadian rhythm with morning light exposure.',
    exercise: isActive
      ? 'Continue current activity level. Add recovery days. Focus on quality over quantity. Include mobility work.'
      : 'Start with 10-15 minutes daily movement. Gradually increase. Include strength training 2-3x/week. Prioritize consistency.',
    stressManagement: [
      'Morning meditation (10 minutes)',
      'Breathing exercises (4-7-8 technique)',
      'Evening journaling',
      'Nature exposure daily',
      'Digital detox periods',
    ],
    dailyRoutine: `6-7 AM: Wake, morning light exposure, hydration
7-8 AM: Breakfast with supplements
8-12 PM: Focus work, movement break
12-1 PM: Lunch
1-5 PM: Afternoon activities
5-6 PM: Dinner preparation
6-7 PM: Dinner with supplements
7-9 PM: Wind down, no screens
9-10 PM: Evening routine, sleep`,
  }
}

