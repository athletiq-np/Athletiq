import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Activity,
  Shield,
  Zap,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Bell,
  Calendar,
  BarChart3,
  PieChart,
  Globe,
  Database,
  Layers,
  Target,
  Award,
  TrendingDown,
  Wifi,
  Server,
  HardDrive,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Camera,
  Video,
  Mic,
  Headphones,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Share,
  Link,
  Copy,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  LogOut,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Image,
  Folder,
  Archive,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Percent,
  DollarSign,
  Euro,
  Pound,
  Yen,
  Bitcoin,
  CreditCard,
  Banknote,
  Wallet,
  ShoppingCart,
  ShoppingBag,
  Gift,
  Package,
  Truck,
  Plane,
  Car,
  Bike,
  Bus,
  Train,
  Ship,
  Rocket,
  Satellite,
  Radar,
  Radio,
  Tv,
  Speaker,
  Gamepad2,
  Joystick,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Spade,
  Club,
  Heart,
  Diamond,
  Crown,
  Gem,
  Key,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Fingerprint,
  ScanFace,
  ScanLine,
  ScanQrCode,
  QrCode,
  Barcode,
  Palette,
  Brush,
  Pipette,
  Eraser,
  Scissors,
  Ruler,
  Compass,
  Triangle,
  Circle,
  Hexagon,
  Pentagon,
  Octagon,
  Smile,
  Frown,
  Meh,
  Angry,
  Laugh,
  Wink,
  Kiss,
  Surprised,
  Confused,
  Neutral,
  Expressionless,
  Unamused,
  Disappointed,
  Worried,
  Hushed,
  Sleepy,
  Tired,
  Sleeping,
  Relieved,
  Sunglasses,
  Nerd,
  Monocle,
  Dizzy,
  Exploding,
  Cowboy,
  Partying,
  Disguised,
  Robot,
  Cat,
  Dog,
  Mouse,
  Hamster,
  Rabbit,
  Fox,
  Bear,
  Panda,
  Koala,
  Tiger,
  Lion,
  Cow,
  Pig,
  Frog,
  Monkey,
  Chicken,
  Penguin,
  Bird,
  Fish,
  Whale,
  Dolphin,
  Shark,
  Octopus,
  Butterfly,
  Bug,
  Ant,
  Bee,
  Beetle,
  Snail,
  Snake,
  Lizard,
  Turtle,
  Crab,
  Lobster,
  Shrimp,
  Squid,
  Oyster,
  Clam,
  Mushroom,
  Flower,
  Tulip,
  Rose,
  Sunflower,
  Blossom,
  Rosette,
  Lotus,
  Hibiscus,
  Cherry,
  Peach,
  Pear,
  Apple,
  Tangerine,
  Lemon,
  Banana,
  Watermelon,
  Grapes,
  Strawberry,
  Melon,
  Cherries,
  Peaches,
  Pears,
  Apples,
  Tangerines,
  Lemons,
  Bananas,
  Watermelons,
  Pineapple,
  Mango,
  Papaya,
  Avocado,
  Eggplant,
  Potato,
  Carrot,
  Corn,
  Pepper,
  Cucumber,
  Leafy,
  Broccoli,
  Garlic,
  Onion,
  Tomato,
  Radish,
  Lettuce,
  Spinach,
  Kale,
  Cabbage,
  Cauliflower,
  Artichoke,
  Asparagus,
  Celery,
  Chili,
  Ginger,
  Herbs,
  Spices,
  Salt,
  Sugar,
  Honey,
  Bread,
  Croissant,
  Bagel,
  Pretzel,
  Pancakes,
  Waffle,
  Cheese,
  Meat,
  Poultry,
  Bacon,
  Hamburger,
  Pizza,
  Hotdog,
  Sandwich,
  Taco,
  Burrito,
  Salad,
  Soup,
  Curry,
  Spaghetti,
  Ramen,
  Sushi,
  Bento,
  Rice,
  Noodles,
  Dumpling,
  Fortune,
  Takeout,
  Chopsticks,
  Plate,
  Bowl,
  Spoon,
  Fork,
  Knife,
  Jar,
  Bottle,
  Glass,
  Cup,
  Teacup,
  Coffee,
  Tea,
  Mate,
  Bubble,
  Milk,
  Baby,
  Water,
  Juice,
  Soda,
  Beer,
  Wine,
  Cocktail,
  Tropical,
  Champagne,
  Sake,
  Whiskey,
  Vodka,
  Rum,
  Brandy,
  Gin,
  Tequila,
  Absinthe,
  Liqueur,
  Cordial,
  Aperitif,
  Digestif,
  Nightcap,
  Mocktail,
  Smoothie,
  Shake,
  Latte,
  Cappuccino,
  Espresso,
  Americano,
  Mocha,
  Macchiato,
  Frappe,
  Iced,
  Hot,
  Cold,
  Frozen,
  Steaming,
  Boiling,
  Simmering,
  Grilling,
  Roasting,
  Baking,
  Frying,
  Smoking,
  Curing,
  Pickling,
  Fermenting,
  Distilling,
  Brewing,
  Aging,
  Marinating,
  Seasoning,
  Tasting,
  Serving,
  Plating,
  Garnishing,
  Decorating,
  Presenting,
  Enjoying,
  Savoring,
  Digesting,
  Satisfying,
  Nourishing,
  Energizing,
  Refreshing,
  Hydrating,
  Warming,
  Cooling,
  Soothing,
  Comforting,
  Indulging,
  Treating,
  Celebrating,
  Sharing,
  Bonding,
  Connecting,
  Socializing,
  Entertaining,
  Hosting,
  Inviting,
  Welcoming,
  Greeting,
  Thanking,
  Appreciating,
  Complimenting,
  Praising,
  Encouraging,
  Supporting,
  Helping,
  Assisting,
  Guiding,
  Teaching,
  Learning,
  Discovering,
  Exploring,
  Investigating,
  Researching,
  Studying,
  Analyzing,
  Evaluating,
  Comparing,
  Contrasting,
  Differentiating,
  Identifying,
  Recognizing,
  Understanding,
  Comprehending,
  Grasping,
  Realizing,
  Knowing,
  Remembering,
  Forgetting,
  Recalling,
  Reminding,
  Informing,
  Notifying,
  Alerting,
  Warning,
  Advising,
  Suggesting,
  Recommending,
  Proposing,
  Offering,
  Providing,
  Supplying,
  Delivering,
  Distributing,
  Giving,
  Donating,
  Contributing,
  Participating,
  Engaging,
  Involving,
  Including,
  Accepting,
  Receiving,
  Taking,
  Getting,
  Obtaining,
  Acquiring,
  Purchasing,
  Buying,
  Selling,
  Trading,
  Exchanging,
  Swapping,
  Switching,
  Changing,
  Modifying,
  Altering,
  Adjusting,
  Adapting,
  Customizing,
  Personalizing,
  Tailoring,
  Fitting,
  Matching,
  Coordinating,
  Harmonizing,
  Balancing,
  Stabilizing,
  Securing,
  Protecting,
  Defending,
  Guarding,
  Watching,
  Monitoring,
  Observing,
  Tracking,
  Following,
  Pursuing,
  Chasing,
  Hunting,
  Searching,
  Seeking,
  Finding,
  Locating,
  Positioning,
  Placing,
  Arranging,
  Organizing,
  Sorting,
  Grouping,
  Categorizing,
  Classifying,
  Labeling,
  Marking,
  Highlighting,
  Emphasizing,
  Stressing,
  Focusing,
  Concentrating,
  Centering,
  Targeting,
  Aiming,
  Directing,
  Pointing,
  Indicating,
  Showing,
  Displaying,
  Demonstrating,
  Illustrating,
  Explaining,
  Describing,
  Detailing,
  Specifying,
  Clarifying,
  Defining,
  Outlining,
  Summarizing,
  Reviewing,
  Examining,
  Inspecting,
  Checking,
  Verifying,
  Confirming,
  Validating,
  Approving,
  Rejecting,
  Declining,
  Refusing,
  Denying,
  Prohibiting,
  Forbidding,
  Restricting,
  Limiting,
  Controlling,
  Managing,
  Supervising,
  Overseeing,
  Leading,
  Steering,
  Navigating,
  Piloting,
  Driving,
  Operating,
  Running,
  Executing,
  Performing,
  Conducting,
  Carrying,
  Handling,
  Dealing,
  Processing,
  Computing,
  Calculating,
  Measuring,
  Quantifying,
  Counting,
  Numbering,
  Ranking,
  Rating,
  Scoring,
  Grading,
  Assessing,
  Judging,
  Criticizing,
  Commenting,
  Feedback,
  Response,
  Reaction,
  Opinion,
  Thought,
  Idea,
  Concept,
  Notion,
  Theory,
  Hypothesis,
  Assumption,
  Belief,
  Faith,
  Trust,
  Confidence,
  Certainty,
  Doubt,
  Uncertainty,
  Confusion,
  Clarity,
  Insight,
  Wisdom,
  Knowledge,
  Information,
  Data,
  Facts,
  Evidence,
  Proof,
  Verification,
  Confirmation,
  Validation,
  Approval,
  Permission,
  Authorization,
  Clearance,
  Access,
  Entry,
  Admission,
  Acceptance,
  Inclusion,
  Membership,
  Participation,
  Involvement,
  Engagement,
  Interaction,
  Communication,
  Conversation,
  Discussion,
  Dialogue,
  Debate,
  Argument,
  Disagreement,
  Conflict,
  Resolution,
  Solution,
  Answer,
  Result,
  Outcome,
  Consequence,
  Effect,
  Impact,
  Influence,
  Power,
  Force,
  Strength,
  Energy,
  Vigor,
  Vitality,
  Health,
  Wellness,
  Fitness,
  Condition,
  State,
  Status,
  Position,
  Location,
  Place,
  Spot,
  Point,
  Area,
  Region,
  Zone,
  Territory,
  Domain,
  Field,
  Scope,
  Range,
  Extent,
  Reach,
  Span,
  Length,
  Width,
  Height,
  Depth,
  Size,
  Scale,
  Proportion,
  Ratio,
  Percentage,
  Fraction,
  Decimal,
  Number,
  Digit,
  Figure,
  Amount,
  Quantity,
  Volume,
  Capacity,
  Limit,
  Maximum,
  Minimum,
  Average,
  Mean,
  Median,
  Mode,
  Total,
  Sum,
  Difference,
  Product,
  Quotient,
  Remainder,
  Factor,
  Multiple,
  Divisor,
  Dividend,
  Equation,
  Formula,
  Expression,
  Variable,
  Constant,
  Parameter,
  Argument,
  Function,
  Method,
  Procedure,
  Process,
  Step,
  Stage,
  Phase,
  Level,
  Grade,
  Rank,
  Order,
  Sequence,
  Series,
  Chain,
  Link,
  Connection,
  Relationship,
  Association,
  Correlation,
  Dependency,
  Requirement,
  Necessity,
  Need,
  Want,
  Desire,
  Wish,
  Hope,
  Dream,
  Goal,
  Objective,
  Purpose,
  Intention,
  Plan,
  Strategy,
  Approach,
  Technique,
  Skill,
  Ability,
  Talent,
  Gift,
  Weakness,
  Advantage,
  Disadvantage,
  Benefit,
  Drawback,
  Pro,
  Con,
  Positive,
  Negative,
  Good,
  Bad,
  Right,
  Wrong,
  Correct,
  Incorrect,
  True,
  False,
  Yes,
  No,
  Maybe,
  Perhaps,
  Possibly,
  Probably,
  Certainly,
  Definitely,
  Absolutely,
  Completely,
  Entirely,
  Totally,
  Fully,
  Partially,
  Partly,
  Somewhat,
  Slightly,
  Barely,
  Hardly,
  Scarcely,
  Almost,
  Nearly,
  Approximately,
  About,
  Around,
  Roughly,
  Exactly,
  Precisely,
  Specifically,
  Particularly,
  Especially,
  Mainly,
  Mostly,
  Generally,
  Usually,
  Often,
  Frequently,
  Regularly,
  Occasionally,
  Sometimes,
  Rarely,
  Seldom,
  Never,
  Always,
  Forever,
  Permanently,
  Temporarily,
  Briefly,
  Shortly,
  Soon,
  Later,
  Eventually,
  Finally,
  Ultimately,
  Originally,
  Initially,
  First,
  Second,
  Third,
  Last,
  Final,
  Previous,
  Next,
  Current,
  Present,
  Past,
  Future,
  Now,
  Then,
  Before,
  After,
  During,
  While,
  When,
  Where,
  Why,
  What,
  Who,
  Which,
  How,
  Many,
  Much,
  Few,
  Little,
  Some,
  Any,
  All,
  None,
  Each,
  Every,
  Both,
  Either,
  Neither,
  Other,
  Another,
  Same,
  Different,
  Similar,
  Alike,
  Unlike,
  Opposite,
  Reverse,
  Backward,
  Forward,
  Up,
  Down,
  Left,
  Right,
  North,
  South,
  East,
  West,
  Inside,
  Outside,
  Above,
  Below,
  Over,
  Under,
  Through,
  Across,
  Along,
  Near,
  Far,
  Close,
  Distant,
  Here,
  There,
  Everywhere,
  Nowhere,
  Somewhere,
  Anywhere,
  This,
  That,
  These,
  Those,
  Such,
  Like,
  As,
  Than,
  If,
  Unless,
  Because,
  Since,
  Although,
  Though,
  However,
  Nevertheless,
  Nonetheless,
  Moreover,
  Furthermore,
  Additionally,
  Also,
  Too,
  And,
  Or,
  But,
  So,
  Yet,
  For,
  Nor,
  With,
  Without,
  Within,
  Beyond,
  Between,
  Among,
  Against,
  Toward,
  Upon,
  Onto,
  Into,
  From,
  To,
  At,
  On,
  In,
  By,
  Of,
  Concerning,
  Regarding,
  Respecting,
  Considering,
  Excluding,
  Except,
  Besides,
  Apart,
  Aside,
  Instead,
  Rather,
  Quite,
  Very,
  Really,
  Actually,
  Indeed,
  Surely,
  Obviously,
  Clearly,
  Apparently,
  Seemingly,
  Presumably,
  Supposedly,
  Allegedly,
  Reportedly,
  Evidently,
  Trophy,
  Info,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('overview'); // overview, analytics, documents, users, system
  const [timeRange, setTimeRange] = useState('7d'); // 1d, 7d, 30d, 90d
  const [isRealTime, setIsRealTime] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', message: '15 new documents processed', time: '2m ago' },
    { id: 2, type: 'warning', message: 'System maintenance in 2 hours', time: '5m ago' },
    { id: 3, type: 'info', message: 'Monthly report ready', time: '1h ago' }
  ]);
  
  const [stats, setStats] = useState({
    totalUsers: 1247,
    activeUsers: 892,
    totalDocuments: 8942,
    processingDocuments: 23,
    completedDocuments: 8519,
    errorDocuments: 12,
    totalRevenue: 125840,
    systemHealth: 98.7,
    apiResponseTime: 145,
    storageUsed: 67.3,
    cpuUsage: 23.5,
    memoryUsage: 45.2,
    networkActivity: 89.1
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'upload', user: 'John Doe', action: 'uploaded document', file: 'athlete_profile.pdf', time: '2m ago' },
    { id: 2, type: 'approve', user: 'Admin', action: 'approved document', file: 'medical_cert.jpg', time: '5m ago' },
    { id: 3, type: 'delete', user: 'Sarah Wilson', action: 'deleted document', file: 'old_contract.pdf', time: '8m ago' },
    { id: 4, type: 'process', user: 'System', action: 'processed document', file: 'id_scan.jpg', time: '12m ago' }
  ]);

  const [topPerformers, setTopPerformers] = useState([
    { id: 1, name: 'John Doe', uploads: 156, accuracy: 98.5, badge: 'gold' },
    { id: 2, name: 'Sarah Wilson', uploads: 142, accuracy: 96.8, badge: 'silver' },
    { id: 3, name: 'Mike Johnson', uploads: 128, accuracy: 94.2, badge: 'bronze' },
    { id: 4, name: 'Emma Davis', uploads: 98, accuracy: 97.1, badge: 'rising' }
  ]);

  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, level: 'critical', message: 'Database connection timeout', count: 3, time: '1m ago' },
    { id: 2, level: 'warning', message: 'High memory usage detected', count: 1, time: '5m ago' },
    { id: 3, level: 'info', message: 'Backup completed successfully', count: 1, time: '2h ago' }
  ]);

  const mockRecentDocuments = [
    {
      id: 1,
      filename: 'athlete_profile_2024.pdf',
      user: { name: 'John Doe', email: 'john@example.com', avatar: 'JD' },
      documentType: 'Player ID',
      status: 'completed',
      createdAt: new Date().toISOString(),
      size: '2.4 MB',
      processingTime: '1.2s',
      confidence: 98.5
    },
    {
      id: 2,
      filename: 'medical_certificate.jpg',
      user: { name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'SW' },
      documentType: 'Medical',
      status: 'processing',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      size: '3.1 MB',
      processingTime: '0.8s',
      confidence: 87.2
    },
    {
      id: 3,
      filename: 'contract_document.pdf',
      user: { name: 'Mike Johnson', email: 'mike@example.com', avatar: 'MJ' },
      documentType: 'Contract',
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      size: '1.8 MB',
      processingTime: '2.1s',
      confidence: 94.8
    }
  ];

  const [recentDocuments, setRecentDocuments] = useState(mockRecentDocuments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ...existing code...

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      // In real app, call fetchDashboardData()
    }, 1000);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4 text-blue-500" />;
      case 'approve': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'process': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBadgeIcon = (badge) => {
    switch (badge) {
      case 'gold': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'silver': return <Award className="h-4 w-4 text-gray-400" />;
      case 'bronze': return <Award className="h-4 w-4 text-amber-600" />;
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const MetricCard = ({ title, value, icon: Icon, trend, color, description }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 cursor-pointer hover:scale-105"
          onClick={onClick}>
      <CardContent className="p-6 text-center">
        <div className={`mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );

  const ActivityFeed = () => (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Live Activity Feed
          {isRealTime && <Badge className="bg-green-100 text-green-700">LIVE</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto">
          {recentActivity.map((activity, index) => (
            <div key={activity.id} className={`p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors ${index === 0 ? 'bg-blue-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.file}</p>
                </div>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const TopPerformersCard = () => (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {topPerformers.map((performer, index) => (
            <div key={performer.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                {getBadgeIcon(performer.badge)}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                {performer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{performer.name}</p>
                <p className="text-xs text-gray-500">{performer.uploads} uploads • {performer.accuracy}% accuracy</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const SystemHealthCard = () => (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-green-600" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-green-600">{stats.systemHealth}%</div>
            <p className="text-sm text-gray-500">Overall Health</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              <span className="text-sm font-semibold text-gray-900">{stats.cpuUsage}%</span>
            </div>
            <Progress value={stats.cpuUsage} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Memory</span>
              <span className="text-sm font-semibold text-gray-900">{stats.memoryUsage}%</span>
            </div>
            <Progress value={stats.memoryUsage} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Storage</span>
              <span className="text-sm font-semibold text-gray-900">{stats.storageUsed}%</span>
            </div>
            <Progress value={stats.storageUsed} className="h-2" />
          </div>
          
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">API Response</span>
              <span className="font-medium text-green-600">{stats.apiResponseTime}ms</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SystemAlertsCard = () => (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {systemAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              alert.level === 'critical' ? 'bg-red-50' : alert.level === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white">
                  {getAlertIcon(alert.level)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">{alert.time}</p>
                </div>
                {alert.count > 1 && (
                  <Badge className="bg-red-100 text-red-700">
                    {alert.count}x
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderOverviewContent = () => (
    <div className="space-y-8">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={12}
          color="from-blue-500 to-indigo-500"
          description="Active athletes & coaches"
        />
        <MetricCard
          title="Documents Processed"
          value={stats.totalDocuments.toLocaleString()}
          icon={FileText}
          trend={8}
          color="from-emerald-500 to-green-500"
          description="Total processed this month"
        />
        <MetricCard
          title="Success Rate"
          value={`${((stats.completedDocuments / stats.totalDocuments) * 100).toFixed(1)}%`}
          icon={Target}
          trend={2.4}
          color="from-amber-500 to-orange-500"
          description="Processing accuracy"
        />
        <MetricCard
          title="Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}k`}
          icon={DollarSign}
          trend={15}
          color="from-purple-500 to-pink-500"
          description="Monthly recurring revenue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <QuickActionCard
          title="Upload Documents"
          description="Add new files to process"
          icon={Upload}
          color="from-blue-500 to-indigo-500"
          onClick={() => setActiveView('documents')}
        />
        <QuickActionCard
          title="View Analytics"
          description="Detailed performance insights"
          icon={BarChart3}
          color="from-green-500 to-emerald-500"
          onClick={() => setActiveView('analytics')}
        />
        <QuickActionCard
          title="Manage Users"
          description="User accounts & permissions"
          icon={UserPlus}
          color="from-purple-500 to-pink-500"
          onClick={() => setActiveView('users')}
        />
        <QuickActionCard
          title="System Status"
          description="Monitor system health"
          icon={Shield}
          color="from-orange-500 to-red-500"
          onClick={() => setActiveView('system')}
        />
      </div>

      {/* Activity & Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityFeed />
        <TopPerformersCard />
      </div>

      {/* System Health & Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SystemHealthCard />
        <SystemAlertsCard />
      </div>
    </div>
  );

  const renderDocumentsContent = () => (
    <div className="space-y-6">
      {/* Documents Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-gray-600">Process and manage uploaded documents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Documents Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        {doc.filename.endsWith('.pdf') ? (
                          <FileText className="h-4 w-4 text-red-600" />
                        ) : (
                          <Image className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-xs text-gray-500">{doc.size}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {doc.user.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{doc.user.name}</p>
                        <p className="text-xs text-gray-500">{doc.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.documentType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={doc.status === 'completed' ? 'default' : doc.status === 'processing' ? 'secondary' : 'outline'}
                      className={
                        doc.status === 'completed' ? 'bg-green-100 text-green-700' :
                        doc.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={doc.confidence} className="w-16 h-2" />
                      <span className="text-xs font-medium">{doc.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsContent = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
        <p className="text-gray-600">Advanced analytics and reporting features coming soon</p>
      </div>
    </div>
  );

  const renderUsersContent = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">User Management</h3>
        <p className="text-gray-600">User management features coming soon</p>
      </div>
    </div>
  );

  const renderSystemContent = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">System Settings</h3>
        <p className="text-gray-600">System configuration and monitoring tools coming soon</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AthletiQ Admin</h1>
                <p className="text-sm text-gray-600">Welcome back, Administrator</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRealTime(!isRealTime)}
                  className={isRealTime ? 'border-green-300 bg-green-50' : ''}
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  {isRealTime ? 'Live' : 'Offline'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="relative">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="grid w-full grid-cols-5 bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
              >
                <Home className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
              >
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
              >
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className="flex items-center gap-2 py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50"
              >
                <Server className="h-4 w-4" />
                System
              </TabsTrigger>
            </TabsList>
            
            <div className="max-w-7xl mx-auto px-6 py-8">
              <TabsContent value="overview" className="mt-0">
                {renderOverviewContent()}
              </TabsContent>
              <TabsContent value="documents" className="mt-0">
                {renderDocumentsContent()}
              </TabsContent>
              <TabsContent value="analytics" className="mt-0">
                {renderAnalyticsContent()}
              </TabsContent>
              <TabsContent value="users" className="mt-0">
                {renderUsersContent()}
              </TabsContent>
              <TabsContent value="system" className="mt-0">
                {renderSystemContent()}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
