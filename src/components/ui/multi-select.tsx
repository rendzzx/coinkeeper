
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type MultiSelectOption = {
  value: string;
  label: string;
};

export type MultiSelectGroupOption = {
    label: string;
    options: MultiSelectOption[];
}

type MultiSelectProps = {
  options: MultiSelectOption[] | MultiSelectGroupOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
  handleCreate?: (value: string) => void;
  isGrouped?: boolean;
  disabled?: boolean;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select...",
  handleCreate,
  isGrouped = false,
  disabled = false,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleCreateAndSelect = () => {
    if (handleCreate && inputValue) {
      handleCreate(inputValue);
      onChange([...selected, inputValue]);
      setInputValue("");
    }
  };

  const getLabel = (value: string): string => {
    if (isGrouped) {
        for (const group of options as MultiSelectGroupOption[]) {
            const option = group.options.find(opt => opt.value === value);
            if (option) return option.label;
        }
    } else {
        const option = (options as MultiSelectOption[]).find(opt => opt.value === value);
        if (option) return option.label;
    }
    return value;
  }

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              selected.map((item) => (
                <Badge
                  variant="secondary"
                  key={item}
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnselect(item);
                  }}
                >
                  {getLabel(item)}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command className={className}>
          <CommandInput 
            placeholder="Search ..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
                {handleCreate && inputValue ? (
                <div 
                    onClick={handleCreateAndSelect}
                    className="cursor-pointer p-2 text-sm"
                >
                    Create "{inputValue}"
                </div>
                ) : (
                "No item found."
                )}
            </CommandEmpty>
            {isGrouped ? (
                (options as MultiSelectGroupOption[]).map(group => (
                    <CommandGroup key={group.label} heading={group.label}>
                        {group.options.map(option => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => {
                                onChange(
                                    selected.includes(option.value)
                                    ? selected.filter((item) => item !== option.value)
                                    : [...selected, option.value]
                                )
                                setOpen(true)
                                }}
                            >
                                <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))
            ) : (
                <CommandGroup className="max-h-64 overflow-auto">
                    {(options as MultiSelectOption[]).map((option) => (
                    <CommandItem
                        key={option.value}
                        onSelect={() => {
                        onChange(
                            selected.includes(option.value)
                            ? selected.filter((item) => item !== option.value)
                            : [...selected, option.value]
                        )
                        setOpen(true)
                        }}
                    >
                        <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                        />
                        {option.label}
                    </CommandItem>
                    ))}
                </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
