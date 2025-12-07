import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

const TagInput = ({ 
  tags, 
  onTagsChange, 
  placeholder = "افزودن تگ...",
  maxTags = 10,
  suggestions = []
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => !tags.includes(s) && s.includes(inputValue)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px] bg-white">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-gray-300 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length < maxTags ? placeholder : ''}
          disabled={tags.length >= maxTags}
          className="flex-1 border-0 focus-visible:ring-0 min-w-[120px] p-0"
        />
      </div>
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="border rounded-lg bg-white shadow-lg max-h-[200px] overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-right px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        {tags.length}/{maxTags} تگ • Enter برای افزودن
      </p>
    </div>
  );
};

export default TagInput;
