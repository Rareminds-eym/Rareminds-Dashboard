import { useState } from 'react';
import { 
  Plus, 
  Users, 
  Award, 
  Target, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Star,
  Clock,
  MapPin
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

interface NanmaduvalanMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'pending';
  contributions: number;
  achievements: string[];
  currentProjects: string[];
  skills: string[];
  mentorshipLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  socialImpactScore: number;
  volunteerHours: number;
}

interface Initiative {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'environment' | 'healthcare' | 'technology' | 'community';
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  targetBeneficiaries: number;
  currentBeneficiaries: number;
  budget: number;
  spentAmount: number;
  volunteers: string[];
  location: string;
  organizer: string;
  impactMetrics: {
    metric: string;
    target: number;
    achieved: number;
  }[];
}

const NanmaduvalanPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const [members] = useState<NanmaduvalanMember[]>([
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya.sharma@rareminds.in',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
      role: 'Senior Developer',
      department: 'Engineering',
      joinDate: '2024-01-15',
      status: 'active',
      contributions: 45,
      achievements: ['Community Champion', 'Education Advocate', 'Tech Mentor'],
      currentProjects: ['Digital Literacy Program', 'Rural School Tech Setup'],
      skills: ['React', 'Node.js', 'Teaching', 'Project Management'],
      mentorshipLevel: 'advanced',
      socialImpactScore: 92,
      volunteerHours: 120
    },
    {
      id: '2',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@rareminds.in',
      role: 'Product Manager',
      department: 'Product',
      joinDate: '2024-02-20',
      status: 'active',
      contributions: 38,
      achievements: ['Healthcare Innovation', 'Team Leader'],
      currentProjects: ['Telemedicine Platform', 'Health Awareness Campaign'],
      skills: ['Product Strategy', 'Healthcare', 'Leadership'],
      mentorshipLevel: 'expert',
      socialImpactScore: 88,
      volunteerHours: 95
    },
    {
      id: '3',
      name: 'Anitha Reddy',
      email: 'anitha.reddy@rareminds.in',
      role: 'UX Designer',
      department: 'Design',
      joinDate: '2024-03-10',
      status: 'active',
      contributions: 32,
      achievements: ['Design for Good', 'Accessibility Champion'],
      currentProjects: ['Inclusive Design Workshop', 'NGO Website Redesign'],
      skills: ['UI/UX Design', 'Accessibility', 'Workshop Facilitation'],
      mentorshipLevel: 'intermediate',
      socialImpactScore: 85,
      volunteerHours: 78
    }
  ]);

  const [initiatives] = useState<Initiative[]>([
    {
      id: '1',
      title: 'Digital Literacy for Rural Communities',
      description: 'Teaching basic computer skills and digital literacy to rural community members to bridge the digital divide.',
      category: 'education',
      status: 'active',
      startDate: '2024-03-01',
      targetBeneficiaries: 500,
      currentBeneficiaries: 245,
      budget: 150000,
      spentAmount: 75000,
      volunteers: ['1', '2'],
      location: 'Karnataka Rural Areas',
      organizer: 'Priya Sharma',
      impactMetrics: [
        { metric: 'People Trained', target: 500, achieved: 245 },
        { metric: 'Computers Donated', target: 50, achieved: 30 },
        { metric: 'Training Centers Established', target: 10, achieved: 6 }
      ]
    },
    {
      id: '2',
      title: 'Telemedicine for Remote Areas',
      description: 'Providing healthcare access through technology for remote and underserved communities.',
      category: 'healthcare',
      status: 'active',
      startDate: '2024-02-15',
      targetBeneficiaries: 1000,
      currentBeneficiaries: 567,
      budget: 300000,
      spentAmount: 180000,
      volunteers: ['2', '3'],
      location: 'Tamil Nadu Remote Villages',
      organizer: 'Rajesh Kumar',
      impactMetrics: [
        { metric: 'Consultations Provided', target: 1000, achieved: 567 },
        { metric: 'Health Centers Connected', target: 15, achieved: 12 },
        { metric: 'Medical Devices Deployed', target: 20, achieved: 16 }
      ]
    },
    {
      id: '3',
      title: 'Sustainable Agriculture Tech',
      description: 'Implementing IoT and smart farming techniques to help farmers increase productivity sustainably.',
      category: 'environment',
      status: 'planning',
      startDate: '2024-07-01',
      targetBeneficiaries: 300,
      currentBeneficiaries: 0,
      budget: 200000,
      spentAmount: 15000,
      volunteers: ['1'],
      location: 'Andhra Pradesh Farming Communities',
      organizer: 'Nanmaduvalan Team',
      impactMetrics: [
        { metric: 'Farmers Onboarded', target: 300, achieved: 0 },
        { metric: 'Smart Sensors Installed', target: 100, achieved: 0 },
        { metric: 'Yield Improvement %', target: 25, achieved: 0 }
      ]
    }
  ]);

  const getCategoryColor = (category: Initiative['category']) => {
    switch (category) {
      case 'education': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'healthcare': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'environment': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'technology': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'community': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Initiative['status']) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMentorshipLevelColor = (level: NanmaduvalanMember['mentorshipLevel']) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalVolunteerHours = members.reduce((sum, member) => sum + member.volunteerHours, 0);
  const totalBeneficiaries = initiatives.reduce((sum, initiative) => sum + initiative.currentBeneficiaries, 0);
  const totalBudget = initiatives.reduce((sum, initiative) => sum + initiative.budget, 0);
  const activeInitiatives = initiatives.filter(initiative => initiative.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Nanmaduvalan (நன்மடுவளன்)
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Social Impact & Community Service Platform
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CalendarIcon className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Impact Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold">{members.filter(m => m.status === 'active').length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Volunteer Hours</p>
                  <p className="text-2xl font-bold text-green-600">{totalVolunteerHours}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Beneficiaries</p>
                  <p className="text-2xl font-bold text-purple-600">{totalBeneficiaries}</p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Initiatives</p>
                  <p className="text-2xl font-bold text-orange-600">{activeInitiatives}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Initiatives */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Recent Initiatives
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {initiatives.slice(0, 3).map((initiative) => (
                    <div key={initiative.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{initiative.title}</h4>
                        <p className="text-xs text-muted-foreground">{initiative.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(initiative.category)} variant="secondary">
                            {initiative.category}
                          </Badge>
                          <Badge className={getStatusColor(initiative.status)} variant="secondary">
                            {initiative.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{initiative.currentBeneficiaries}</p>
                        <p className="text-xs text-muted-foreground">beneficiaries</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Top Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {members
                    .sort((a, b) => b.socialImpactScore - a.socialImpactScore)
                    .slice(0, 3)
                    .map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="text-lg font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{member.name}</h4>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.socialImpactScore}</p>
                        <p className="text-xs text-muted-foreground">impact score</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Initiatives Tab */}
          <TabsContent value="initiatives" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search initiatives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Initiative
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {initiatives.map((initiative) => (
                <Card key={initiative.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg leading-6">{initiative.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge className={getCategoryColor(initiative.category)} variant="secondary">
                            {initiative.category}
                          </Badge>
                          <Badge className={getStatusColor(initiative.status)} variant="secondary">
                            {initiative.status}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">
                      {initiative.description}
                    </CardDescription>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Beneficiaries Progress</span>
                        <span className="font-medium">
                          {initiative.currentBeneficiaries} / {initiative.targetBeneficiaries}
                        </span>
                      </div>
                      <Progress 
                        value={(initiative.currentBeneficiaries / initiative.targetBeneficiaries) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Budget Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget Used</span>
                        <span className="font-medium">
                          ₹{initiative.spentAmount.toLocaleString()} / ₹{initiative.budget.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={(initiative.spentAmount / initiative.budget) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Location and Organizer */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{initiative.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{initiative.volunteers.length} volunteers</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Organized by {initiative.organizer}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription>{member.role} • {member.department}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Impact Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Impact Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{member.socialImpactScore}</span>
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      </div>
                    </div>

                    {/* Volunteer Hours */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Volunteer Hours</span>
                      <span className="font-medium">{member.volunteerHours}h</span>
                    </div>

                    {/* Mentorship Level */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Mentorship Level</span>
                      <Badge className={getMentorshipLevelColor(member.mentorshipLevel)} variant="secondary">
                        {member.mentorshipLevel}
                      </Badge>
                    </div>

                    {/* Current Projects */}
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Current Projects</span>
                      <div className="flex flex-wrap gap-1">
                        {member.currentProjects.slice(0, 2).map((project) => (
                          <Badge key={project} variant="outline" className="text-xs">
                            {project}
                          </Badge>
                        ))}
                        {member.currentProjects.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.currentProjects.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Achievements</span>
                      <div className="flex flex-wrap gap-1">
                        {member.achievements.slice(0, 2).map((achievement) => (
                          <Badge key={achievement} variant="secondary" className="text-xs">
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Impact Tab */}
          <TabsContent value="impact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Impact Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Impact Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Beneficiaries Reached</span>
                      <span className="font-bold text-lg">{totalBeneficiaries}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Budget Allocated</span>
                      <span className="font-bold text-lg">₹{totalBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Volunteers</span>
                      <span className="font-bold text-lg">{members.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Community Hours Contributed</span>
                      <span className="font-bold text-lg">{totalVolunteerHours}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Initiative Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['education', 'healthcare', 'environment', 'technology', 'community'].map((category) => {
                      const categoryInitiatives = initiatives.filter(i => i.category === category);
                      const percentage = (categoryInitiatives.length / initiatives.length) * 100;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm capitalize">{category}</span>
                            <span className="text-sm font-medium">{categoryInitiatives.length}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NanmaduvalanPage;
