import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, X, Edit3, Star, Lightbulb } from 'lucide-react';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';

interface KeyHighlightsManagerProps {
  highlights: string[];
  onChange: (highlights: string[]) => void;
  disabled?: boolean;
  minHighlights?: number;
  maxHighlights?: number;
  shouldTriggerAddHighlight?: boolean;
  onTriggerAddHighlightReset?: () => void;
}

export const KeyHighlightsManager: React.FC<KeyHighlightsManagerProps> = ({
  highlights,
  onChange,
  disabled = false,
  minHighlights = 1,
  maxHighlights = 8,
  shouldTriggerAddHighlight = false,
  onTriggerAddHighlightReset
}) => {
  const [newHighlight, setNewHighlight] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingHighlight, setEditingHighlight] = useState('');
  const [isAddingHighlight, setIsAddingHighlight] = useState(false);

  const canAddMore = highlights.length < maxHighlights;
  const hasMinimumHighlights = highlights.length >= minHighlights;

  // Handle external trigger to show add highlight form
  useEffect(() => {
    if (shouldTriggerAddHighlight && canAddMore && !disabled) {
      setIsAddingHighlight(true);
      // Reset the trigger
      if (onTriggerAddHighlightReset) {
        onTriggerAddHighlightReset();
      }
    }
  }, [shouldTriggerAddHighlight, canAddMore, disabled, onTriggerAddHighlightReset]);

  const handleAddHighlight = () => {
    const trimmedHighlight = newHighlight.trim();
    if (trimmedHighlight && !highlights.includes(trimmedHighlight) && highlights.length < maxHighlights) {
      const newHighlights = [...highlights, trimmedHighlight];
      console.log('KeyHighlightsManager: Adding highlight:', trimmedHighlight);
      console.log('KeyHighlightsManager: New highlights array:', newHighlights);
      onChange(newHighlights);
      setNewHighlight('');
      setIsAddingHighlight(false);
    }
  };

  const handleEditHighlight = (index: number) => {
    const trimmedHighlight = editingHighlight.trim();
    if (trimmedHighlight && !highlights.includes(trimmedHighlight)) {
      const updatedHighlights = highlights.map((highlight, i) =>
        i === index ? trimmedHighlight : highlight
      );
      onChange(updatedHighlights);
      setEditingIndex(null);
      setEditingHighlight('');
    }
  };

  const handleRemoveHighlight = (indexToRemove: number) => {
    const updatedHighlights = highlights.filter((_, index) => index !== indexToRemove);
    onChange(updatedHighlights);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingHighlight(highlights[index]);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingHighlight('');
  };

  const handleCancelAdd = () => {
    setNewHighlight('');
    setIsAddingHighlight(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit', index?: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'add') {
        handleAddHighlight();
      } else if (action === 'edit' && index !== undefined) {
        handleEditHighlight(index);
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (action === 'add') {
        handleCancelAdd();
      } else if (action === 'edit') {
        handleCancelEdit();
      }
    }
  };

  return (
    <div className="space-y-4">

      {/* Add New Highlight Form */}
      {isAddingHighlight && (
        <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                New Key Highlight
              </Label>
              <Textarea
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'add')}
                placeholder="Enter a key highlight for your event (e.g., 'Live hands-on coding workshop', 'Industry expert speakers', 'Free certification provided')"
                className="border-slate-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all duration-200"
                rows={2}
                disabled={disabled}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAdd}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddHighlight}
                  disabled={disabled || !newHighlight.trim() || highlights.includes(newHighlight.trim())}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add Highlight
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Highlights List */}
      {highlights.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">
            Added Highlights ({highlights.length})
          </Label>
          <div className="space-y-2">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="group p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {editingIndex === index ? (
                  // Edit mode
                  <div className="space-y-3">
                    <Textarea
                      value={editingHighlight}
                      onChange={(e) => setEditingHighlight(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'edit', index)}
                      className="border-slate-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all duration-200"
                      rows={2}
                      disabled={disabled}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={disabled}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleEditHighlight(index)}
                        disabled={disabled || !editingHighlight.trim() || (highlights.includes(editingHighlight.trim()) && editingHighlight.trim() !== highlight)}
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-1.5 bg-yellow-100 rounded-full flex-shrink-0 mt-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />
                      </div>
                      <p className="text-slate-700 leading-relaxed break-words">
                        {highlight}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(index)}
                        disabled={disabled}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200"
                        title="Edit highlight"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHighlight(index)}
                        disabled={disabled}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                        title="Remove highlight"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {highlights.length === 0 && !isAddingHighlight && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-yellow-100 rounded-full">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <p className="text-gray-500 mb-2">No key highlights added yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Add highlights to showcase what makes your event special
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingHighlight(true)}
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Highlight
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Messages */}
      {!hasMinimumHighlights && highlights.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            Please add at least {minHighlights - highlights.length} more highlight{minHighlights - highlights.length !== 1 ? 's' : ''} 
            ({highlights.length}/{minHighlights} minimum)
          </p>
        </div>
      )}

      {highlights.length >= maxHighlights && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            Maximum number of highlights reached ({maxHighlights}/{maxHighlights})
          </p>
        </div>
      )}

      {/* Helper Text */}
      {highlights.length === 0 && !isAddingHighlight && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs text-slate-600">
            <strong>Tips for great highlights:</strong> Focus on unique benefits, learning outcomes, 
            networking opportunities, expert speakers, hands-on activities, certifications, or exclusive content.
          </p>
        </div>
      )}
    </div>
  );
};
