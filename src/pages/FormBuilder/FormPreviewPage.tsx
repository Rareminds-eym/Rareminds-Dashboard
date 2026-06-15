import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { useForms } from '../../hooks/useForms';
import { FormWithFields } from '../../types/form';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import FormPreview from '../../components/FormBuilder/FormPreview';

const FormPreviewPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getFormById, loading } = useForms();
  const [form, setForm] = useState<FormWithFields | null>(null);

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    if (!formId) return;
    const formData = await getFormById(formId);
    if (formData) {
      setForm(formData);
    }
  };

  if (loading || !form) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-8 px-4 animate-in fade-in duration-500">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/form-builder')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Form Preview
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  This is how your form will appear to users
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate(`/form-builder/${formId}/edit`)}
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Form
            </Button>
          </div>

          {/* Preview Card */}
          <Card className="p-8 shadow-lg">
            <FormPreview
              title={form.title}
              description={form.description || undefined}
              fields={form.fields}
            />
          </Card>

          {/* Info Footer */}
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              This is a preview only. The actual form will be embedded in event registration pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreviewPage;
