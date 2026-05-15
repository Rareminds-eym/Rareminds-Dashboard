import { Program } from '../../../types/program';
import { Plus, FileText, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface DashboardOverviewProps {
  programs: Program[];
  onNewProgram: () => void;
  onViewPrograms: () => void;
}

const DashboardOverview = ({ programs, onNewProgram, onViewPrograms }: DashboardOverviewProps) => {
  const recentPrograms = programs.slice(0, 3);
  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.is_active === true).length;
  const thisMonthPrograms = programs.filter(program => {
    const programDate = new Date(program.created_at);
    const now = new Date();
    return programDate.getMonth() === now.getMonth() && programDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-8 p-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Programs</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              All published programs
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">This Month</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{thisMonthPrograms}</div>
            <p className="text-xs text-muted-foreground">
              Programs this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Active Programs</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{activePrograms}</div>
            <p className="text-xs text-muted-foreground">
              Currently active programs
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={onNewProgram} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <Plus className="w-4 h-4 mr-3" />
              New Program
            </Button>
            <Button onClick={onViewPrograms} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 mr-3" />
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 rounded-3xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-light text-foreground">Recent Programs</CardTitle>
          <CardDescription className="text-muted-foreground">Your latest published programs</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recentPrograms.length > 0 ? (
            <div className="space-y-6">
              {recentPrograms.map((program) => (
                <div key={program.id} className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-secondary/30 transition-all duration-200 border border-transparent hover:border-border/50">
                  {program.image_url && (
                    <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                      <img
                        src={program.image_url}
                        alt={program.title}
                        className="w-20 h-20 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="font-medium text-foreground truncate text-lg group-hover:text-primary transition-colors">
                      {program.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {program.short_description || 'No description available'}
                    </p>
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {program.status && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-primary/10 text-primary"
                          >
                            {program.status}
                          </Badge>
                        )}
                        {program.program_type && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600"
                          >
                            {program.program_type}
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(program.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-6 text-lg">No programs yet. Create your first program to get started!</p>
              <Button onClick={onNewProgram} className="bg-primary hover:bg-primary/90 shadow-lg px-8 py-3 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create First Program
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
