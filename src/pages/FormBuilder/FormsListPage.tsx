import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Copy, Trash2, Eye, Power, MoreVertical } from 'lucide-react';
import { useForms } from '../../hooks/useForms';
import { FormWithFields } from '../../types/form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '../../components/ui/alert-dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { format } from 'date-fns';

const FormsListPage = () => {
  const navigate = useNavigate();
  const { forms, loading, deleteForm, duplicateForm, updateForm } = useForms();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  // Filter forms based on search and active status
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && form.is_active) ||
      (filterActive === 'inactive' && !form.is_active);

    return matchesSearch && matchesFilter;
  });

  const handleDelete = async () => {
    if (formToDelete) {
      await deleteForm(formToDelete);
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  const handleDuplicate = async (formId: string) => {
    const duplicated = await duplicateForm(formId);
    if (duplicated) {
      navigate(`/form-builder/${duplicated.id}/edit`);
    }
  };

  const handleToggleActive = async (form: FormWithFields) => {
    // Validate: at least one field required to activate
    if (!form.is_active && form.fields.length === 0) {
      alert('Cannot activate a form with no fields. Please add at least one field.');
      return;
    }

    await updateForm(form.id, {
      title: form.title,
      description: form.description || '',
      is_active: !form.is_active
    });
  };

  if (loading && forms.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Form Builder</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create and manage custom registration forms for your events
          </p>
        </div>
        <Button 
          onClick={() => navigate('/form-builder/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Form
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterActive === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterActive('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterActive === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterActive('active')}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={filterActive === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilterActive('inactive')}
            size="sm"
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Forms Grid */}
      {filteredForms.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Filter className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchQuery || filterActive !== 'all' ? 'No forms found' : 'No forms yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchQuery || filterActive !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first custom form'}
              </p>
              {!searchQuery && filterActive === 'all' && (
                <Button onClick={() => navigate('/form-builder/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map(form => (
            <Card key={form.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                      {form.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                      {form.description || 'No description'}
                    </p>
                  </div>
                  <Badge variant={form.is_active ? 'default' : 'secondary'}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="font-semibold">{form.fields.length}</span> fields
                  </div>
                  <div>
                    Updated {format(new Date(form.updated_at), 'MMM d, yyyy')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/form-builder/${form.id}/edit`)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => navigate(`/form-builder/${form.id}/preview`)}
                        className="cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Form
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(form.id)}
                        className="cursor-pointer"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(form)}
                        className="cursor-pointer"
                      >
                        <Power className="h-4 w-4 mr-2" />
                        {form.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setFormToDelete(form.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this form? This action cannot be undone.
              All fields associated with this form will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFormToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormsListPage;
