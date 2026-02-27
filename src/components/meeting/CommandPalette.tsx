import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Filter, FileText, RotateCcw, Eye, ListTodo, MessageSquare, HelpCircle, User, Calendar,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: string) => void;
}

export function CommandPalette({ open, onOpenChange, onAction }: Props) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Filters">
          <CommandItem onSelect={() => { onAction("filter-low"); onOpenChange(false); }}>
            <Filter className="h-4 w-4 mr-2" />
            Filter low-confidence items
          </CommandItem>
          <CommandItem onSelect={() => { onAction("filter-unassigned"); onOpenChange(false); }}>
            <User className="h-4 w-4 mr-2" />
            Show Unassigned only
          </CommandItem>
          <CommandItem onSelect={() => { onAction("filter-no-date"); onOpenChange(false); }}>
            <Calendar className="h-4 w-4 mr-2" />
            Show missing due dates
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="View">
          <CommandItem onSelect={() => { onAction("toggle-mode"); onOpenChange(false); }}>
            <Eye className="h-4 w-4 mr-2" />
            Toggle Clean / Review mode
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Export">
          <CommandItem onSelect={() => { onAction("export-markdown"); onOpenChange(false); }}>
            <FileText className="h-4 w-4 mr-2" />
            Export Markdown
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Regenerate">
          <CommandItem onSelect={() => { onAction("regen-tasks"); onOpenChange(false); }}>
            <ListTodo className="h-4 w-4 mr-2" />
            Regenerate Tasks only
          </CommandItem>
          <CommandItem onSelect={() => { onAction("regen-decisions"); onOpenChange(false); }}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Regenerate Decisions only
          </CommandItem>
          <CommandItem onSelect={() => { onAction("regen-confirm"); onOpenChange(false); }}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Regenerate Things to confirm only
          </CommandItem>
          <CommandItem onSelect={() => { onAction("regen-all"); onOpenChange(false); }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Regenerate all
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
