import React, { useState } from 'react';
import { FAQItem } from '../../types/event';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface FAQManagerProps {
  faqs: FAQItem[];
  onChange: (faqs: FAQItem[]) => void;
  disabled?: boolean;
}

interface EditingFAQ extends FAQItem {
  index: number;
  isEditing: boolean;
}

export const FAQManager: React.FC<FAQManagerProps> = ({
  faqs,
  onChange,
  disabled = false
}) => {
  const [editingFAQ, setEditingFAQ] = useState<EditingFAQ | null>(null);
  const [newFAQ, setNewFAQ] = useState<FAQItem>({ question: '', answer: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleAddFAQ = () => {
    if (newFAQ.question.trim() && newFAQ.answer.trim()) {
      const updatedFAQs = [...faqs, newFAQ];
      onChange(updatedFAQs);
      setNewFAQ({ question: '', answer: '' });
      setIsAddingNew(false);
    }
  };

  const handleEditFAQ = (index: number) => {
    setEditingFAQ({
      ...faqs[index],
      index,
      isEditing: true
    });
  };

  const handleSaveEdit = () => {
    if (editingFAQ && editingFAQ.question.trim() && editingFAQ.answer.trim()) {
      const updatedFAQs = [...faqs];
      updatedFAQs[editingFAQ.index] = {
        question: editingFAQ.question,
        answer: editingFAQ.answer
      };
      onChange(updatedFAQs);
      setEditingFAQ(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingFAQ(null);
  };

  const handleDeleteFAQ = (index: number) => {
    const updatedFAQs = faqs.filter((_, i) => i !== index);
    onChange(updatedFAQs);
  };

  const handleCancelAdd = () => {
    setNewFAQ({ question: '', answer: '' });
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
        {!isAddingNew && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </Button>
        )}
      </div>

      {/* Add New FAQ Form */}
      {isAddingNew && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm">Add New FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Question</label>
              <Input
                value={newFAQ.question}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question here..."
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Answer</label>
              <Textarea
                value={newFAQ.answer}
                onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Enter the answer here..."
                rows={3}
                disabled={disabled}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddFAQ}
                disabled={disabled || !newFAQ.question.trim() || !newFAQ.answer.trim()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Add FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing FAQs */}
      {faqs.length > 0 && (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="relative">
              {editingFAQ?.index === index ? (
                /* Edit Mode */
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Question</label>
                    <Input
                      value={editingFAQ.question}
                      onChange={(e) => setEditingFAQ(prev => prev ? { ...prev, question: e.target.value } : null)}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Answer</label>
                    <Textarea
                      value={editingFAQ.answer}
                      onChange={(e) => setEditingFAQ(prev => prev ? { ...prev, answer: e.target.value } : null)}
                      rows={3}
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={disabled}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={disabled || !editingFAQ.question.trim() || !editingFAQ.answer.trim()}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              ) : (
                /* Display Mode */
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Q: {faq.question}
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        A: {faq.answer}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFAQ(index)}
                        disabled={disabled}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFAQ(index)}
                        disabled={disabled}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {faqs.length === 0 && !isAddingNew && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No FAQs added yet</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingNew(true)}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First FAQ
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
