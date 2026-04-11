import { Program } from '../../../types/program';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Edit, Trash2, Eye, Calendar, MapPin } from 'lucide-react';

interface ProjectListProps {
  programs: Program[];
  onEditProgram?: (program: Program) => void;
  onDeleteProgram?: (programId: string) => void;
}

const ProjectList = ({ programs, onEditProgram, onDeleteProgram }: ProjectListProps) => {
  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      onDeleteProgram?.(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (programs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-slate-50 rounded-2xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Programs Yet</h3>
          <p className="text-slate-600">
            Start by creating your first program to showcase your work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map((program) => (
        <Card key={program.id} className="border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
                  {program.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  {formatDate(program.created_at)}
                </CardDescription>
              </div>
              <div className="flex gap-1 ml-2">
                {onEditProgram && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditProgram(program)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {onDeleteProgram && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(program.id, program.title)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Image */}
            {program.image_url && (
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <img
                  src={program.image_url}
                  alt={program.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Short Description */}
            {program.short_description && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                {program.short_description}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {program.status && (
                <Badge variant="secondary" className={`text-xs px-2 py-1 ${getStatusColor(program.status)}`}>
                  {program.status}
                </Badge>
              )}
              {program.program_type && (
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200">
                  {program.program_type}
                </Badge>
              )}
              {program.location && (
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200">
                  <MapPin className="w-3 h-3 mr-1" />
                  {program.location}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {onEditProgram && (
                <Button
                  size="sm"
                  className="flex-1 text-sm bg-blue-600 hover:bg-blue-700"
                  onClick={() => onEditProgram(program)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectList;
