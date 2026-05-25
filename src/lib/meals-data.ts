export type MealCategory = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Pre-Game' | 'Post-Game' | 'Recovery';

export type Meal = {
  id: string;
  name: string;
  category: MealCategory;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepMins: number;
  why: string;
  ingredients: string[];
  steps: string[];
};

export const MEALS: Meal[] = [
  // ── BREAKFAST ──
  {
    id: 'b1', name: 'Oats with Banana & Honey', category: 'Breakfast',
    calories: 380, protein: 12, carbs: 68, fats: 5, prepMins: 5,
    why: 'Slow-release carbs fuel a full morning of activity. Potassium from the banana prevents cramping.',
    ingredients: ['80g rolled oats', '1 banana, sliced', '1 tbsp honey', '250ml milk or water', 'Pinch of salt'],
    steps: ['Cook oats with milk/water over medium heat 3–4 min, stirring.', 'Pour into bowl, top with banana and honey.', 'Eat 60–90 min before training.'],
  },
  {
    id: 'b2', name: 'Egg & Avocado Toast', category: 'Breakfast',
    calories: 420, protein: 18, carbs: 35, fats: 22, prepMins: 8,
    why: 'Complete amino acid profile from eggs + healthy monounsaturated fats for sustained energy.',
    ingredients: ['2 eggs', '½ avocado', '2 slices wholegrain bread', 'Lemon juice', 'Salt, pepper, chilli flakes'],
    steps: ['Toast the bread.', 'Poach or fry eggs 3–4 min.', 'Mash avocado with lemon, salt, pepper. Spread on toast.', 'Top with eggs and chilli flakes.'],
  },
  {
    id: 'b3', name: 'Greek Yogurt Parfait', category: 'Breakfast',
    calories: 320, protein: 22, carbs: 45, fats: 5, prepMins: 3,
    why: 'High casein protein for overnight muscle repair. Berries provide antioxidants for recovery.',
    ingredients: ['200g full-fat Greek yogurt', '1 handful mixed berries', '30g granola', '1 tsp honey'],
    steps: ['Layer yogurt in a bowl.', 'Add berries, granola, drizzle honey.', 'Eat immediately so granola stays crunchy.'],
  },
  {
    id: 'b4', name: 'Protein Smoothie', category: 'Breakfast',
    calories: 350, protein: 30, carbs: 40, fats: 6, prepMins: 4,
    why: 'Fast-absorbing liquid nutrition — ideal if you train within 30 minutes of waking.',
    ingredients: ['1 scoop vanilla protein powder', '1 banana', '200ml milk', '1 tbsp peanut butter', '1 handful ice'],
    steps: ['Blend all ingredients until smooth.', 'Drink immediately — protein degrades if left sitting.'],
  },
  {
    id: 'b5', name: 'Scrambled Eggs & Veggies', category: 'Breakfast',
    calories: 360, protein: 24, carbs: 8, fats: 26, prepMins: 8,
    why: 'High protein, low carb — ideal on rest days or when you want to stay lean.',
    ingredients: ['3 eggs', '½ capsicum, diced', '1 handful spinach', '1 tbsp butter', 'Salt & pepper'],
    steps: ['Melt butter in pan over medium-low heat.', 'Add capsicum, cook 2 min.', 'Add spinach, stir until wilted.', 'Add whisked eggs, fold slowly until just set.'],
  },

  // ── LUNCH ──
  {
    id: 'l1', name: 'Chicken Rice Bowl', category: 'Lunch',
    calories: 520, protein: 42, carbs: 58, fats: 8, prepMins: 20,
    why: 'The staple athlete meal. Lean protein + complex carbs = sustained energy and muscle support.',
    ingredients: ['150g chicken breast', '120g jasmine rice (dry)', '½ avocado', '1 tbsp soy sauce', 'Sesame seeds, spring onion'],
    steps: ['Cook rice.', 'Season chicken with soy sauce, grill or pan-fry 6 min each side.', 'Slice and serve over rice with avocado.', 'Garnish with sesame and spring onion.'],
  },
  {
    id: 'l2', name: 'Tuna Salad Wrap', category: 'Lunch',
    calories: 480, protein: 38, carbs: 42, fats: 12, prepMins: 5,
    why: 'Omega-3s from tuna reduce inflammation. Quick to make — perfect on a school day.',
    ingredients: ['1 can tuna in springwater, drained', '2 tbsp Greek yogurt (or light mayo)', '1 large wholegrain wrap', 'Lettuce, tomato, cucumber', 'Lemon juice, salt, pepper'],
    steps: ['Mix tuna with yogurt, lemon, salt, pepper.', 'Layer onto wrap with vegetables.', 'Roll tight and slice in half.'],
  },
  {
    id: 'l3', name: 'Grilled Chicken Salad', category: 'Lunch',
    calories: 380, protein: 40, carbs: 18, fats: 14, prepMins: 15,
    why: 'High protein, low calorie — ideal for cut weeks or the day before a weigh-in.',
    ingredients: ['150g chicken breast', '100g rocket/spinach mix', 'Cherry tomatoes', '½ cucumber', '1 tbsp olive oil', 'Balsamic vinegar'],
    steps: ['Season and grill chicken 6 min each side.', 'Slice and cool slightly.', 'Toss greens with oil and vinegar.', 'Top with chicken, tomatoes, cucumber.'],
  },
  {
    id: 'l4', name: 'Pasta Bolognese', category: 'Lunch',
    calories: 580, protein: 35, carbs: 72, fats: 14, prepMins: 25,
    why: 'High-carb athlete fuel. Great the night before a big game to top up glycogen stores.',
    ingredients: ['120g pasta', '100g lean beef mince', '½ onion', '1 can diced tomatoes', 'Garlic, Italian herbs', '1 tbsp parmesan'],
    steps: ['Cook pasta.', 'Brown mince with onion and garlic.', 'Add tomatoes and herbs, simmer 10 min.', 'Serve over pasta, top with parmesan.'],
  },
  {
    id: 'l5', name: 'Salmon & Veggie Bowl', category: 'Lunch',
    calories: 490, protein: 36, carbs: 40, fats: 18, prepMins: 20,
    why: 'Omega-3 fatty acids from salmon fight muscle inflammation post-training.',
    ingredients: ['130g salmon fillet', '100g brown rice', 'Broccoli, edamame', '1 tbsp soy sauce', '1 tsp sesame oil', 'Pickled ginger'],
    steps: ['Cook rice. Steam broccoli 5 min.', 'Pan-fry salmon skin-down 4 min, flip 2 min.', 'Assemble bowl with rice, salmon, veggies.', 'Drizzle with soy and sesame oil.'],
  },

  // ── DINNER ──
  {
    id: 'd1', name: 'Salmon & Sweet Potato', category: 'Dinner',
    calories: 560, protein: 40, carbs: 52, fats: 16, prepMins: 30,
    why: 'Beta-carotene from sweet potato + omega-3s from salmon = elite recovery combo.',
    ingredients: ['150g salmon fillet', '1 large sweet potato', 'Asparagus or green beans', 'Olive oil, garlic', 'Lemon, dill'],
    steps: ['Preheat oven to 200°C. Cube sweet potato, toss in olive oil, roast 25 min.', 'Season salmon with garlic, lemon, dill. Bake last 12 min.', 'Steam asparagus 4 min. Serve together.'],
  },
  {
    id: 'd2', name: 'Beef Stir-Fry & Rice', category: 'Dinner',
    calories: 580, protein: 38, carbs: 65, fats: 12, prepMins: 15,
    why: 'Iron and zinc from beef support oxygen transport and immune function — critical for high-load weeks.',
    ingredients: ['150g lean beef strips', '120g jasmine rice', 'Capsicum, broccoli, snap peas', '2 tbsp oyster sauce', '1 tbsp soy sauce', 'Garlic, ginger'],
    steps: ['Cook rice.', 'High heat wok with oil. Sear beef 2 min, set aside.', 'Stir-fry veggies 3 min with garlic and ginger.', 'Return beef, add sauces, toss 1 min. Serve on rice.'],
  },
  {
    id: 'd3', name: 'Turkey Mince Tacos', category: 'Dinner',
    calories: 520, protein: 36, carbs: 45, fats: 18, prepMins: 15,
    why: 'Turkey is the leanest ground meat. Corn tortillas are easy to digest for evening meals.',
    ingredients: ['150g turkey mince', '4 small corn tortillas', 'Salsa, avocado, lime', 'Taco spice mix', 'Red cabbage, coriander'],
    steps: ['Brown turkey with taco spice 5–6 min.', 'Warm tortillas.', 'Fill with turkey, top with salsa, avocado, cabbage, lime.'],
  },
  {
    id: 'd4', name: 'Chicken Thighs & Veggies', category: 'Dinner',
    calories: 490, protein: 44, carbs: 28, fats: 20, prepMins: 35,
    why: 'Thigh meat has more iron and zinc than breast. Roasted veggies add fibre and micronutrients.',
    ingredients: ['2 chicken thighs (skin off)', 'Zucchini, capsicum, red onion', 'Olive oil, paprika, garlic powder', 'Salt, pepper, lemon'],
    steps: ['Preheat oven 200°C.', 'Toss veggies in oil, season. Spread on tray.', 'Season chicken, place on top.', 'Roast 30–35 min until chicken is cooked through.'],
  },

  // ── SNACK ──
  {
    id: 's1', name: 'Rice Cakes & Peanut Butter', category: 'Snack',
    calories: 280, protein: 10, carbs: 30, fats: 14, prepMins: 1,
    why: 'Quick carbs + healthy fats = perfect 30-min pre-workout fuel or afternoon energy.',
    ingredients: ['4 rice cakes', '2 tbsp peanut butter', 'Optional: banana slices'],
    steps: ['Spread peanut butter on rice cakes.', 'Add banana if using. Eat immediately.'],
  },
  {
    id: 's2', name: 'Hard-Boiled Eggs & Fruit', category: 'Snack',
    calories: 200, protein: 14, carbs: 20, fats: 6, prepMins: 10,
    why: 'Portable, zero-sugar protein hit. The fruit provides fast carbs and vitamins.',
    ingredients: ['2 large eggs', '1 apple or orange', 'Pinch of salt'],
    steps: ['Boil eggs 8 min for hard-boiled. Cool in cold water.', 'Peel, season with salt. Eat with fruit.'],
  },
  {
    id: 's3', name: 'Banana & Almonds', category: 'Snack',
    calories: 260, protein: 8, carbs: 38, fats: 10, prepMins: 1,
    why: 'Magnesium from almonds prevents cramps. Banana replenishes potassium quickly.',
    ingredients: ['1 large banana', '25g raw almonds'],
    steps: ['Eat together. Simple, no prep.'],
  },
  {
    id: 's4', name: 'Cottage Cheese & Berries', category: 'Snack',
    calories: 220, protein: 20, carbs: 22, fats: 4, prepMins: 2,
    why: 'Casein protein digests slowly — great as a pre-sleep snack to feed muscles overnight.',
    ingredients: ['150g low-fat cottage cheese', '80g mixed berries', '1 tsp honey'],
    steps: ['Spoon cottage cheese into bowl.', 'Top with berries and honey.'],
  },

  // ── PRE-GAME ──
  {
    id: 'pg1', name: 'White Toast & Honey', category: 'Pre-Game',
    calories: 280, protein: 6, carbs: 58, fats: 2, prepMins: 2,
    why: 'Fastest-absorbing pre-match meal. White bread skips the fibre that causes gut issues at kickoff.',
    ingredients: ['2 slices white bread', '2 tbsp honey', 'Optional: light spread of butter'],
    steps: ['Toast bread.', 'Spread honey.', 'Eat 2–3 hours before kickoff.', 'Drink 500ml water with it.'],
  },
  {
    id: 'pg2', name: 'Plain Oats & Water', category: 'Pre-Game',
    calories: 310, protein: 10, carbs: 58, fats: 5, prepMins: 5,
    why: 'Easy to digest, steady energy release. Avoid milk on match day — can cause bloating.',
    ingredients: ['80g rolled oats', '250ml water', 'Pinch of salt', '1 tsp honey'],
    steps: ['Cook oats with water 4 min.', 'Add honey and salt only.', 'NO dairy, no heavy toppings on match day.'],
  },
  {
    id: 'pg3', name: 'Banana & Sports Drink', category: 'Pre-Game',
    calories: 160, protein: 2, carbs: 40, fats: 0, prepMins: 1,
    why: 'If kickoff is in under 60 minutes — fast carbs only. Nothing heavy.',
    ingredients: ['1 large banana', '500ml isotonic sports drink (or water + electrolytes)'],
    steps: ['Eat banana 45–60 min before kickoff.', 'Sip sports drink steadily, not all at once.'],
  },

  // ── POST-GAME ──
  {
    id: 'po1', name: 'Chocolate Milk', category: 'Post-Game',
    calories: 180, protein: 12, carbs: 26, fats: 4, prepMins: 1,
    why: 'The research-backed recovery drink. Ideal carb:protein ratio to kickstart glycogen re-synthesis.',
    ingredients: ['400ml low-fat chocolate milk'],
    steps: ['Drink within 30 minutes of the final whistle.', 'Follow up with a full meal within 90 min.'],
  },
  {
    id: 'po2', name: 'Chicken & White Rice', category: 'Post-Game',
    calories: 480, protein: 38, carbs: 58, fats: 5, prepMins: 20,
    why: 'Post-match meal of champions. White rice absorbs fast. Chicken rebuilds what you tore down.',
    ingredients: ['150g chicken breast', '120g white rice (dry)', 'Soy sauce, garlic', 'Spring onion'],
    steps: ['Cook rice.', 'Pan-fry seasoned chicken 12–14 min total.', 'Slice over rice. Add soy sauce and spring onion.'],
  },
  {
    id: 'po3', name: 'Protein Shake & Banana', category: 'Post-Game',
    calories: 340, protein: 28, carbs: 44, fats: 4, prepMins: 2,
    why: 'When you\'re too tired to cook — at least do this. Fast protein + carbs before the full meal.',
    ingredients: ['1 scoop whey protein', '1 banana', '300ml water or milk'],
    steps: ['Shake or blend within 20 min of final whistle.', 'Follow with a real meal within 90 min.'],
  },

  // ── RECOVERY ──
  {
    id: 'r1', name: 'Anti-Inflammatory Smoothie', category: 'Recovery',
    calories: 300, protein: 8, carbs: 55, fats: 5, prepMins: 4,
    why: 'Turmeric + ginger + berries = nature\'s ibuprofen. Helps reduce DOMS after heavy sessions.',
    ingredients: ['1 handful frozen mixed berries', '1 banana', '1 tsp turmeric', '½ tsp ginger', '1 tsp honey', '250ml coconut water'],
    steps: ['Blend all until smooth.', 'Drink immediately — anti-inflammatory compounds degrade quickly.'],
  },
  {
    id: 'r2', name: 'Salmon & Quinoa', category: 'Recovery',
    calories: 520, protein: 40, carbs: 45, fats: 16, prepMins: 20,
    why: 'Complete amino acids from quinoa + omega-3s from salmon = the elite recovery meal.',
    ingredients: ['140g salmon', '100g quinoa (dry)', 'Cucumber, cherry tomatoes', 'Lemon, olive oil, parsley'],
    steps: ['Cook quinoa 12 min.', 'Pan-fry salmon 4 min skin-down, 2 min flipped.', 'Serve over quinoa with salad, dress with lemon and olive oil.'],
  },
  {
    id: 'r3', name: 'Bone Broth & Toast', category: 'Recovery',
    calories: 220, protein: 14, carbs: 24, fats: 4, prepMins: 3,
    why: 'Collagen from bone broth repairs tendons and joints. Light enough for sick days or injury recovery.',
    ingredients: ['300ml bone broth (store-bought or homemade)', '2 slices sourdough toast', 'Salt, pepper'],
    steps: ['Heat broth in a small pot.', 'Toast bread.', 'Sip broth like a soup, eat toast slowly.'],
  },
];

export const MEAL_CATEGORIES: MealCategory[] = [
  'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Game', 'Post-Game', 'Recovery'
];
