// Comprehensive algorithm database for Smart Vacuum Algorithm Lab

export interface AlgorithmInfo {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  authors: string[];
  year: number;
  paper: {
    title: string;
    venue: string;
    doi?: string;
    url?: string;
  };
  description: string;
  inputs: string[];
  outputs: string[];
  advantages: string[];
  disadvantages: string[];
  complexity: { time?: string; space?: string };
  memoryRequirements: string;
  applications: string[];
  failureCases: string[];
  parameters: Array<{ name: string; description: string; typical: string; range?: string }>;
  suitableEnvironments: string[];
  realTimeSuitable: boolean;
  projectSuitability: 'high' | 'medium' | 'low';
  projectSuitabilityReason: string;
  projectNotSuitableReason?: string;
  relatedAlgorithms: string[];
  tags: string[];
}

const ALGORITHM_DATABASE: AlgorithmInfo[] = [
  // ======== PATH PLANNING ========
  {
    id: 'dijkstra',
    name: 'Dijkstra\'s Algorithm',
    category: 'Path Planning',
    subcategory: 'Global',
    authors: ['Edsger W. Dijkstra'],
    year: 1959,
    paper: {
      title: 'A note on two problems in connexion with graphs',
      venue: 'Numerische Mathematik, Vol. 1, pp. 269–271',
      doi: '10.1007/BF01386390',
    },
    description: 'A graph search algorithm that finds the shortest path between nodes in a weighted graph by greedily selecting the lowest-cost unvisited node. Guarantees optimal paths in non-negative weighted graphs.',
    inputs: ['Weighted graph / occupancy grid', 'Start node', 'Goal node'],
    outputs: ['Shortest path', 'Cost map from source'],
    advantages: [
      'Guaranteed to find optimal (shortest) path',
      'Complete – always finds a path if one exists',
      'Produces full cost map as a byproduct',
      'Simple to implement correctly',
    ],
    disadvantages: [
      'Does not use heuristic – explores uniformly in all directions',
      'Slower than A* on most practical grids',
      'High memory usage: stores all visited nodes',
      'Not suitable for dynamic environments without full replanning',
    ],
    complexity: { time: 'O((V + E) log V) with binary heap', space: 'O(V)' },
    memoryRequirements: 'Proportional to grid size – all cells stored',
    applications: ['Road network routing', 'Simple indoor path planning', 'Comparison baseline'],
    failureCases: [
      'Very large maps where exhaustive search is too slow',
      'Dynamic obstacles require full replanning',
      'Negative edge weights (not applicable to grids)',
    ],
    parameters: [
      { name: 'Grid resolution', description: 'Size of each cell in meters', typical: '0.05 m', range: '0.02–0.2 m' },
    ],
    suitableEnvironments: ['Static indoor maps', 'Small to medium rooms'],
    realTimeSuitable: false,
    projectSuitability: 'medium',
    projectSuitabilityReason: 'Reliable baseline for static room maps. Produces optimal paths.',
    projectNotSuitableReason: 'Too slow and memory-intensive for large maps. Not suitable for dynamic environments.',
    relatedAlgorithms: ['astar', 'bfs', 'dstarlite'],
    tags: ['global', 'optimal', 'complete', 'grid-based'],
  },
  {
    id: 'astar',
    name: 'A* Search',
    category: 'Path Planning',
    subcategory: 'Global',
    authors: ['Peter E. Hart', 'Nils J. Nilsson', 'Bertram Raphael'],
    year: 1968,
    paper: {
      title: 'A Formal Basis for the Heuristic Determination of Minimum Cost Paths',
      venue: 'IEEE Transactions on Systems Science and Cybernetics, 4(2), pp. 100–107',
      doi: '10.1109/TSSC.1968.300136',
    },
    description: 'An informed search algorithm that uses a heuristic function to guide the search toward the goal. Combines the cost-so-far (g) and estimated cost-to-goal (h) into f = g + h, prioritizing nodes with lowest f.',
    inputs: ['Occupancy grid or graph', 'Start position', 'Goal position', 'Heuristic function'],
    outputs: ['Optimal path (with admissible heuristic)', 'Open set', 'Closed set'],
    advantages: [
      'Optimal with an admissible heuristic (e.g., Euclidean distance)',
      'Complete under appropriate conditions',
      'Significantly faster than Dijkstra on most maps',
      'Widely studied, robust, and well-understood',
    ],
    disadvantages: [
      'Requires a complete map before planning',
      'Memory usage can be large on open search spaces',
      'Does not inherently handle dynamic obstacles',
      'Heuristic quality greatly affects performance',
    ],
    complexity: { time: 'O(b^d) worst case, much better with good heuristic', space: 'O(b^d)' },
    memoryRequirements: 'Open and closed lists – can grow large on large maps',
    applications: ['Indoor robot navigation', 'Game AI pathfinding', 'Logistics planning', 'Autonomous vehicles on known maps'],
    failureCases: [
      'Dynamic obstacles: replanning required',
      'Unknown or partially known maps',
      'Inadmissible heuristic leads to suboptimal paths',
      'Very large, open environments: memory explosion',
    ],
    parameters: [
      { name: 'Heuristic type', description: 'Function estimating remaining cost', typical: 'Octile distance', range: 'Manhattan / Euclidean / Octile' },
      { name: 'Grid resolution', description: 'Cell size in meters', typical: '0.05 m', range: '0.02–0.2 m' },
    ],
    suitableEnvironments: ['Static indoor rooms', 'Mapped environments', 'Multi-room apartments'],
    realTimeSuitable: false,
    projectSuitability: 'high',
    projectSuitabilityReason: 'Excellent choice for initial room mapping with known layout. Fast, optimal, and well-suited to grid-based indoor maps.',
    projectNotSuitableReason: 'Not suitable when the map is unknown or changes dynamically.',
    relatedAlgorithms: ['dijkstra', 'dstarlite', 'rrt'],
    tags: ['global', 'optimal', 'heuristic', 'grid-based', 'complete'],
  },
  {
    id: 'dstarlite',
    name: 'D* Lite',
    category: 'Path Planning',
    subcategory: 'Global / Incremental',
    authors: ['Sven Koenig', 'Maxim Likhachev'],
    year: 2002,
    paper: {
      title: 'D* Lite',
      venue: 'Proceedings of the AAAI Conference on Artificial Intelligence, pp. 476–483',
      url: 'https://ojs.aaai.org/index.php/AAAI/article/view/8168',
    },
    description: 'An incremental replanning algorithm that efficiently updates the path when the environment changes. Plans from goal to start and reuses previous planning information when the map changes, making it far more efficient than full replanning.',
    inputs: ['Grid with possibly unknown areas', 'Start position', 'Goal position', 'Observed changes'],
    outputs: ['Current best path', 'Updated cost map'],
    advantages: [
      'Efficient incremental replanning – only updates affected parts',
      'Optimal for the current known map',
      'Handles unknown/dynamic obstacles efficiently',
      'Much faster than A* when replanning is needed',
    ],
    disadvantages: [
      'More complex to implement correctly',
      'Initial plan requires full computation like A*',
      'Overhead if changes are frequent and widespread',
    ],
    complexity: { time: 'O(k log k) per replan, where k = changed cells', space: 'O(n)' },
    memoryRequirements: 'Similar to A* – stores full priority queue',
    applications: ['Mobile robots in partially unknown environments', 'Dynamic obstacle avoidance with replanning', 'NASA Mars rovers'],
    failureCases: [
      'Extremely frequent environmental changes may cause constant replanning',
      'Complete map restructuring defeats incremental advantage',
    ],
    parameters: [
      { name: 'Grid resolution', description: 'Cell size in meters', typical: '0.05 m' },
    ],
    suitableEnvironments: ['Partially unknown rooms', 'Dynamic indoor environments', 'Maps with changing obstacles'],
    realTimeSuitable: true,
    projectSuitability: 'high',
    projectSuitabilityReason: 'Best choice for real-world vacuum robot where furniture may move or new obstacles appear during cleaning.',
    relatedAlgorithms: ['astar', 'dijkstra', 'rrt'],
    tags: ['global', 'incremental', 'dynamic', 'optimal', 'replanning'],
  },
  {
    id: 'rrt',
    name: 'Rapidly-exploring Random Tree (RRT)',
    category: 'Path Planning',
    subcategory: 'Sampling-based',
    authors: ['Steven M. LaValle'],
    year: 1998,
    paper: {
      title: 'Rapidly-Exploring Random Trees: A New Tool for Path Planning',
      venue: 'Technical Report, Iowa State University',
      url: 'http://msl.cs.illinois.edu/~lavalle/papers/Lav98c.pdf',
    },
    description: 'A sampling-based motion planning algorithm that builds a tree by randomly sampling the configuration space and extending toward sampled points. Effective for high-dimensional spaces and complex environments.',
    inputs: ['Configuration space', 'Start configuration', 'Goal configuration', 'Collision checker'],
    outputs: ['Feasible path (not necessarily optimal)', 'Tree of explored configurations'],
    advantages: [
      'Works in high-dimensional configuration spaces',
      'Probabilistically complete',
      'No grid required – works in continuous space',
      'Good for complex geometry and robot kinematics',
    ],
    disadvantages: [
      'Not optimal – paths are not shortest',
      'Results vary between runs (randomized)',
      'Jagged paths require post-processing smoothing',
      'Less efficient than A* for simple 2D grid navigation',
    ],
    complexity: { time: 'O(n log n) expected', space: 'O(n)' },
    memoryRequirements: 'Stores all tree nodes – grows with iterations',
    applications: ['Robot arm motion planning', 'High-DOF robots', 'Car-like robot planning', 'Drone navigation in 3D'],
    failureCases: [
      'Narrow passages require many iterations',
      'Without goal-biasing, convergence can be slow',
      'Not suitable where path quality is critical',
    ],
    parameters: [
      { name: 'Step size', description: 'Maximum extension length per step', typical: '0.5 m', range: '0.1–2.0 m' },
      { name: 'Goal bias', description: 'Probability of sampling goal directly', typical: '0.1', range: '0.05–0.3' },
      { name: 'Max iterations', description: 'Maximum tree nodes', typical: '5000', range: '1000–50000' },
    ],
    suitableEnvironments: ['Complex environments', 'Narrow corridors', 'Any continuous space'],
    realTimeSuitable: false,
    projectSuitability: 'medium',
    projectSuitabilityReason: 'Useful when room geometry is complex or for benchmark comparison. Less optimal than A* for simple grids.',
    projectNotSuitableReason: 'Non-optimal paths, randomized results, and jagged trajectories reduce cleaning efficiency.',
    relatedAlgorithms: ['rrtstar', 'astar', 'prm'],
    tags: ['sampling', 'probabilistic', 'continuous', 'motion-planning'],
  },
  {
    id: 'rrtstar',
    name: 'RRT* (Optimal RRT)',
    category: 'Path Planning',
    subcategory: 'Sampling-based',
    authors: ['Sertac Karaman', 'Emilio Frazzoli'],
    year: 2011,
    paper: {
      title: 'Sampling-based algorithms for optimal motion planning',
      venue: 'International Journal of Robotics Research, 30(7), pp. 846–894',
      doi: '10.1177/0278364911406761',
    },
    description: 'An asymptotically optimal extension of RRT that rewires the tree to improve path quality. As the number of samples grows, the solution converges to the optimal path.',
    inputs: ['Configuration space', 'Start', 'Goal', 'Collision checker', 'Neighborhood radius'],
    outputs: ['Near-optimal path (asymptotically optimal)', 'Rewired tree'],
    advantages: [
      'Asymptotically optimal – converges to optimal solution',
      'Better path quality than RRT',
      'Works in continuous configuration spaces',
    ],
    disadvantages: [
      'Slower than RRT per iteration due to rewiring',
      'Still requires many iterations for high-quality paths',
      'Not suitable for real-time replanning',
    ],
    complexity: { time: 'O(n log n) per iteration', space: 'O(n)' },
    memoryRequirements: 'Larger than RRT – stores tree with rewiring edges',
    applications: ['Autonomous vehicles', 'UAV path planning', 'Robot arm planning with quality constraints'],
    failureCases: [
      'Convergence speed depends on sampling strategy',
      'Narrow passages still challenging',
    ],
    parameters: [
      { name: 'Rewire radius', description: 'Neighborhood search radius for rewiring', typical: '1.5 m', range: '0.5–3.0 m' },
      { name: 'Step size', description: 'Extension step size', typical: '0.5 m' },
      { name: 'Goal bias', description: 'Goal sampling probability', typical: '0.1' },
    ],
    suitableEnvironments: ['Complex, open environments', 'Where path smoothness matters'],
    realTimeSuitable: false,
    projectSuitability: 'medium',
    projectSuitabilityReason: 'Better path quality than RRT. Good for comparison with grid-based methods.',
    relatedAlgorithms: ['rrt', 'astar', 'informed-rrtstar'],
    tags: ['sampling', 'optimal', 'asymptotic', 'continuous'],
  },

  // ======== LOCAL NAVIGATION ========
  {
    id: 'dwa',
    name: 'Dynamic Window Approach (DWA)',
    category: 'Local Navigation',
    authors: ['Dieter Fox', 'Wolfram Burgard', 'Sebastian Thrun'],
    year: 1997,
    paper: {
      title: 'The Dynamic Window Approach to Collision Avoidance',
      venue: 'IEEE Robotics & Automation Magazine, 4(1), pp. 23–33',
      doi: '10.1109/100.580977',
    },
    description: 'A reactive local navigation algorithm that samples velocities within a "dynamic window" constrained by robot kinematics and selects the velocity command that maximizes a scoring function balancing heading, clearance, and speed.',
    inputs: ['Robot current pose and velocity', 'Goal position', 'LiDAR/obstacle data', 'Robot kinematic constraints'],
    outputs: ['Linear and angular velocity commands', 'Candidate trajectories with scores'],
    advantages: [
      'Accounts for robot kinematics (inertia, acceleration limits)',
      'Real-time capable – fast computation',
      'Naturally handles dynamic obstacles',
      'Generates smooth, feasible trajectories',
    ],
    disadvantages: [
      'Local minima – can get stuck in dead-ends',
      'No global optimality guarantee',
      'Performance depends heavily on scoring function tuning',
      'May not reach goal in narrow corridors',
    ],
    complexity: { time: 'O(v_samples × w_samples × trajectory_steps)', space: 'O(1)' },
    memoryRequirements: 'Minimal – only stores current candidates',
    applications: ['ROS Navigation Stack (move_base)', 'Indoor mobile robots', 'Differential drive robots', 'Robotic vacuum cleaners'],
    failureCases: [
      'Local minima in U-shaped obstacles',
      'Narrow corridors where no velocity is safe',
      'Very fast dynamic obstacles (reaction too slow)',
    ],
    parameters: [
      { name: 'Velocity samples (v)', description: 'Number of linear velocity samples', typical: '8', range: '5–20' },
      { name: 'Velocity samples (ω)', description: 'Number of angular velocity samples', typical: '12', range: '8–24' },
      { name: 'Simulation horizon', description: 'Time to simulate each trajectory', typical: '1.5 s', range: '0.5–3.0 s' },
      { name: 'Heading weight', description: 'Weight of heading score', typical: '0.4' },
      { name: 'Clearance weight', description: 'Weight of clearance score', typical: '0.2' },
    ],
    suitableEnvironments: ['Dynamic indoor environments', 'Open spaces', 'Cluttered rooms'],
    realTimeSuitable: true,
    projectSuitability: 'high',
    projectSuitabilityReason: 'DWA is the standard local planner for indoor mobile robots. Widely used in robotic vacuum cleaners and ROS robots.',
    relatedAlgorithms: ['vfh', 'teb', 'mpc'],
    tags: ['local', 'reactive', 'real-time', 'dynamic-obstacles', 'kinematic'],
  },
  {
    id: 'vfh',
    name: 'Vector Field Histogram (VFH)',
    category: 'Local Navigation',
    authors: ['Johann Borenstein', 'Yoram Koren'],
    year: 1991,
    paper: {
      title: 'The vector field histogram – fast obstacle avoidance for mobile robots',
      venue: 'IEEE Transactions on Robotics and Automation, 7(3), pp. 278–288',
      doi: '10.1109/70.88137',
    },
    description: 'Builds a polar histogram of obstacle densities from sensor readings and selects a steering direction through the lowest-density valley closest to the goal direction.',
    inputs: ['Sensor readings (LiDAR / sonar)', 'Goal direction', 'Robot velocity'],
    outputs: ['Steering direction', 'Linear and angular velocity commands'],
    advantages: [
      'Very fast – O(1) per cycle',
      'Simple to implement',
      'Handles cluttered environments well',
      'Does not require global planning',
    ],
    disadvantages: [
      'No kinematic model – ignores robot inertia',
      'Can select suboptimal valleys',
      'Less principled than DWA',
    ],
    complexity: { time: 'O(sectors)', space: 'O(sectors)' },
    memoryRequirements: 'Minimal – only polar histogram',
    applications: ['Early robotic vacuum cleaners', 'SICK navigation systems', 'Sonar-equipped robots'],
    failureCases: ['Narrow corridors', 'Symmetric obstacle layouts confuse valley selection'],
    parameters: [
      { name: 'Sector size', description: 'Angular resolution of histogram', typical: '10°', range: '5°–15°' },
      { name: 'Threshold', description: 'Obstacle density threshold', typical: '0.5', range: '0.3–0.8' },
    ],
    suitableEnvironments: ['Open rooms', 'Obstacle-rich environments'],
    realTimeSuitable: true,
    projectSuitability: 'medium',
    projectSuitabilityReason: 'Simpler and faster than DWA. Good for simple obstacle avoidance comparison.',
    relatedAlgorithms: ['dwa', 'teb'],
    tags: ['local', 'reactive', 'real-time', 'histogram'],
  },

  // ======== COVERAGE ========
  {
    id: 'boustrophedon',
    name: 'Boustrophedon Decomposition',
    category: 'Coverage Path Planning',
    authors: ['Howie Choset', 'Philippe Pignon'],
    year: 1997,
    paper: {
      title: 'Coverage Path Planning: The Boustrophedon Cellular Decomposition',
      venue: 'Field and Service Robotics, pp. 203–209',
      doi: '10.1007/978-1-4471-1273-0_27',
    },
    description: 'Decomposes the environment into cells that can be covered with simple back-and-forth (boustrophedon) motions. The name comes from the ancient Greek writing style "as the ox plows", alternating directions each row.',
    inputs: ['Known floor map', 'Robot width (strip width)', 'Start position'],
    outputs: ['Coverage waypoints', 'Ordered cell visit sequence'],
    advantages: [
      'Complete coverage guaranteed',
      'Simple and predictable motion',
      'Easy to implement',
      'Low revisitation rate in open spaces',
    ],
    disadvantages: [
      'Poor performance in rooms with furniture',
      'High revisitation at cell boundaries',
      'Not optimal in cluttered environments',
    ],
    complexity: { time: 'O(A / w) where A=area, w=strip width', space: 'O(n)' },
    memoryRequirements: 'Low – stores waypoint sequence only',
    applications: ['Robotic vacuum cleaners', 'Lawn mowers', 'Agricultural robots', 'Floor cleaning robots'],
    failureCases: [
      'Rooms with complex furniture arrangements',
      'Environments with many dead-ends',
      'When robot width ≈ corridor width',
    ],
    parameters: [
      { name: 'Strip width', description: 'Width of each coverage strip', typical: '0.25 m (robot diameter)', range: '0.1–0.5 m' },
    ],
    suitableEnvironments: ['Open rooms', 'Simple rectangular rooms', 'Known maps'],
    realTimeSuitable: false,
    projectSuitability: 'high',
    projectSuitabilityReason: 'The industry standard for robotic vacuum coverage. Produces predictable, complete coverage in open rooms.',
    projectNotSuitableReason: 'Inefficient in heavily furnished rooms with many obstacles.',
    relatedAlgorithms: ['stc', 'lawnmower', 'wavefront'],
    tags: ['coverage', 'complete', 'systematic', 'decomposition'],
  },
  {
    id: 'stc',
    name: 'Spanning Tree Coverage (STC)',
    category: 'Coverage Path Planning',
    authors: ['Yoav Gabriely', 'Elon Rimon'],
    year: 2001,
    paper: {
      title: 'Spanning-tree based coverage of continuous areas by a mobile robot',
      venue: 'Annals of Mathematics and Artificial Intelligence, 31, pp. 77–98',
      doi: '10.1023/A:1016610507833',
    },
    description: 'Constructs a spanning tree of the free space and derives a coverage path by traversing the tree boundary. Guarantees complete, non-overlapping coverage with a single connected path.',
    inputs: ['Grid map', 'Start position'],
    outputs: ['Coverage path visiting all free cells'],
    advantages: [
      'Complete and provably optimal coverage',
      'Single continuous path – no revisits in theory',
      'Works in arbitrary connected environments',
    ],
    disadvantages: [
      'Path can be complex and hard to follow',
      'Tree construction overhead',
      'Not as intuitive as boustrophedon',
    ],
    complexity: { time: 'O(n) for tree traversal', space: 'O(n)' },
    memoryRequirements: 'O(n) for spanning tree',
    applications: ['Agricultural autonomous vehicles', 'Search and rescue robots', 'Thorough cleaning applications'],
    failureCases: ['Disconnected environments', 'Large maps with complex topology'],
    parameters: [],
    suitableEnvironments: ['Any connected indoor environment'],
    realTimeSuitable: false,
    projectSuitability: 'high',
    projectSuitabilityReason: 'Theoretically optimal coverage. Good for comparison with boustrophedon.',
    relatedAlgorithms: ['boustrophedon', 'wavefront'],
    tags: ['coverage', 'optimal', 'spanning-tree', 'complete'],
  },
  {
    id: 'lawnmower',
    name: 'Lawnmower (Simple Row Sweep)',
    category: 'Coverage Path Planning',
    authors: ['Various'],
    year: 1980,
    paper: {
      title: 'N/A – Classical technique predating formal publication',
      venue: 'N/A',
    },
    description: 'The simplest coverage strategy: sweep the environment in parallel rows at a fixed spacing equal to the robot width. Alternates direction each row to minimize travel distance.',
    inputs: ['Room boundaries', 'Robot width'],
    outputs: ['Row-by-row waypoint sequence'],
    advantages: [
      'Extremely simple to implement',
      'Predictable behavior',
      'Fast computation',
    ],
    disadvantages: [
      'Ignores obstacles – requires separate avoidance',
      'High overlap at row ends',
      'Not suitable for non-rectangular rooms',
    ],
    complexity: { time: 'O(A/w)', space: 'O(1)' },
    memoryRequirements: 'Minimal',
    applications: ['Simple vacuum cleaners', 'Agricultural field coverage'],
    failureCases: ['Rooms with furniture', 'Non-rectangular spaces', 'When obstacles block rows'],
    parameters: [
      { name: 'Row spacing', description: 'Distance between adjacent rows', typical: '0.25 m' },
    ],
    suitableEnvironments: ['Empty rectangular rooms'],
    realTimeSuitable: false,
    projectSuitability: 'medium',
    projectSuitabilityReason: 'Good as a simple baseline for coverage comparison.',
    projectNotSuitableReason: 'Too simplistic for real furnished rooms.',
    relatedAlgorithms: ['boustrophedon', 'stc'],
    tags: ['coverage', 'simple', 'row-sweep', 'baseline'],
  },

  // ======== LOCALIZATION ========
  {
    id: 'odometry',
    name: 'Wheel Odometry',
    category: 'Localization',
    authors: ['Various (classical)'],
    year: 1970,
    paper: {
      title: 'N/A – Classical dead-reckoning technique',
      venue: 'N/A',
    },
    description: 'Estimates robot pose by integrating wheel encoder measurements over time. Tracks how much each wheel has rotated to compute displacement and heading change.',
    inputs: ['Left/right wheel encoder readings', 'Previous pose'],
    outputs: ['Estimated pose (x, y, θ)'],
    advantages: [
      'No additional sensors required',
      'Very fast computation',
      'Works without external references',
    ],
    disadvantages: [
      'Accumulates error over time (drift)',
      'Susceptible to wheel slip',
      'Cannot correct for accumulated errors',
      'Highly unreliable over long distances',
    ],
    complexity: { time: 'O(1)', space: 'O(1)' },
    memoryRequirements: 'Minimal – only current state',
    applications: ['Short-range localization', 'Initial pose tracking', 'Sensor fusion input'],
    failureCases: ['Slippery floors', 'Long-distance navigation', 'Carpet (variable friction)'],
    parameters: [
      { name: 'Wheel base', description: 'Distance between wheels', typical: '0.3 m' },
      { name: 'Wheel radius', description: 'Radius of each wheel', typical: '0.05 m' },
    ],
    suitableEnvironments: ['Short-range motion', 'Used as input to EKF/AMCL'],
    realTimeSuitable: true,
    projectSuitability: 'medium',
    projectSuitabilityReason: 'Always needed as input to better localization methods (EKF, AMCL).',
    projectNotSuitableReason: 'Insufficient alone – drift becomes unacceptable over time.',
    relatedAlgorithms: ['ekf', 'amcl', 'imu'],
    tags: ['localization', 'dead-reckoning', 'encoder', 'drift'],
  },
  {
    id: 'ekf',
    name: 'Extended Kalman Filter (EKF)',
    category: 'Localization',
    authors: ['Rudolf E. Kálmán', 'Extensions by Various'],
    year: 1960,
    paper: {
      title: 'A New Approach to Linear Filtering and Prediction Problems',
      venue: 'Journal of Basic Engineering, 82(1), pp. 35–45',
      doi: '10.1115/1.3662552',
    },
    description: 'Extends the Kalman Filter to nonlinear systems using first-order Taylor series linearization. Maintains a Gaussian belief over robot pose and fuses multiple sensor modalities through prediction and update steps.',
    inputs: ['Odometry (motion model)', 'Sensor observations (landmarks or features)', 'Previous state estimate and covariance'],
    outputs: ['Estimated pose', 'Covariance matrix', 'Estimation uncertainty'],
    advantages: [
      'Optimal for linear Gaussian systems',
      'Fuses multiple sensors efficiently',
      'Provides uncertainty estimates',
      'Computationally efficient',
    ],
    disadvantages: [
      'Linearization fails for highly nonlinear systems',
      'Requires known environment (landmarks)',
      'Gaussian assumption may not hold',
    ],
    complexity: { time: 'O(n²) where n = state dimension', space: 'O(n²)' },
    memoryRequirements: 'O(n²) for covariance matrix',
    applications: ['GPS-aided navigation', 'Robot localization with landmarks', 'Sensor fusion (IMU + LiDAR)'],
    failureCases: ['Highly nonlinear motion', 'Kidnapped robot problem', 'Non-Gaussian noise'],
    parameters: [
      { name: 'Process noise Q', description: 'Motion model uncertainty', typical: '0.01' },
      { name: 'Measurement noise R', description: 'Sensor measurement uncertainty', typical: '0.1' },
    ],
    suitableEnvironments: ['Landmark-rich environments', 'Any environment with reliable sensors'],
    realTimeSuitable: true,
    projectSuitability: 'high',
    projectSuitabilityReason: 'Standard choice for indoor robot localization. Fuses odometry with LiDAR for reliable pose estimation.',
    relatedAlgorithms: ['amcl', 'odometry', 'ukf'],
    tags: ['localization', 'kalman', 'sensor-fusion', 'probabilistic'],
  },
  {
    id: 'amcl',
    name: 'AMCL (Adaptive Monte Carlo Localization)',
    category: 'Localization',
    authors: ['Sebastian Thrun', 'Wolfram Burgard', 'Dieter Fox'],
    year: 2001,
    paper: {
      title: 'Probabilistic Robotics',
      venue: 'MIT Press, 2005 (AMCL described in Chapter 8)',
      url: 'https://mitpress.mit.edu/9780262201629/',
    },
    description: 'A particle filter-based localization algorithm that represents the robot\'s belief as a set of particles. Adaptively adjusts the number of particles based on estimated localization quality. The gold standard for ROS-based mobile robot localization.',
    inputs: ['LiDAR scans', 'Odometry', 'Known map', 'Previous particle set'],
    outputs: ['Pose estimate', 'Particle cloud (uncertainty)', 'Confidence'],
    advantages: [
      'Handles global localization (kidnapped robot)',
      'Non-parametric – handles any distribution shape',
      'Robust to sensor noise',
      'Industry standard for indoor mobile robots',
    ],
    disadvantages: [
      'Computationally heavier than EKF',
      'Requires known map',
      'Particle collapse in degenerate environments',
      'Memory scales with particle count',
    ],
    complexity: { time: 'O(M) where M = particle count', space: 'O(M)' },
    memoryRequirements: 'Proportional to particle count (typically 500–5000)',
    applications: ['ROS Navigation Stack', 'Indoor mobile robots', 'Robotic vacuum cleaners (commercial)'],
    failureCases: ['Symmetric environments (particle filter gets confused)', 'Very fast robot motion', 'Very sparse feature environments'],
    parameters: [
      { name: 'Min particles', description: 'Minimum particle count', typical: '100', range: '50–500' },
      { name: 'Max particles', description: 'Maximum particle count', typical: '2000', range: '500–10000' },
      { name: 'Laser model sigma', description: 'LiDAR measurement noise', typical: '0.2 m' },
    ],
    suitableEnvironments: ['Any indoor environment with known map'],
    realTimeSuitable: true,
    projectSuitability: 'high',
    projectSuitabilityReason: 'The industry standard for indoor robot localization. Used in most commercial robotic vacuum cleaners.',
    relatedAlgorithms: ['ekf', 'gmapping', 'odometry'],
    tags: ['localization', 'particle-filter', 'probabilistic', 'mcl', 'ros-standard'],
  },
];

export function getAlgorithmById(id: string): AlgorithmInfo | undefined {
  return ALGORITHM_DATABASE.find(a => a.id === id);
}

export function getAlgorithmsByCategory(category: string): AlgorithmInfo[] {
  return ALGORITHM_DATABASE.filter(a => a.category.toLowerCase().includes(category.toLowerCase()));
}

export function getAllAlgorithms(): AlgorithmInfo[] {
  return ALGORITHM_DATABASE;
}

export function getAlgorithmsByMode(mode: string): AlgorithmInfo[] {
  const modeMap: Record<string, string[]> = {
    localization: ['odometry', 'ekf', 'amcl'],
    slam: [],
    path_planning: ['dijkstra', 'astar', 'dstarlite', 'rrt', 'rrtstar'],
    local_navigation: ['dwa', 'vfh'],
    coverage: ['boustrophedon', 'stc', 'lawnmower'],
    dynamic_obstacles: ['dwa', 'vfh'],
    full_autonomous: ['astar', 'dwa', 'boustrophedon', 'amcl'],
  };
  const ids = modeMap[mode] ?? [];
  return ids.map(id => getAlgorithmById(id)).filter(Boolean) as AlgorithmInfo[];
}

export default ALGORITHM_DATABASE;
