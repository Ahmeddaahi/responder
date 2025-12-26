import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zap } from "lucide-react";

interface QuickRepliesProps {
    onSelect: (text: string) => void;
}

const QUICK_REPLIES = [
    {
        category: "Greetings",
        replies: [
            "Hello! How can I help you today?",
            "Welcome! Let me know if you have any questions.",
            "Hi there! Thanks for reaching out.",
        ],
    },
    {
        category: "Confirmation",
        replies: [
            "I've confirmed your booking.",
            "Great, I've noted that down.",
            "Is there anything else I can help you with?",
        ],
    },
    {
        category: "Support",
        replies: [
            "I'm connecting you with a human agent.",
            "Please give me a moment to check that.",
            "Could you please provide more details?",
        ],
    },
];

const QuickReplies = ({ onSelect }: QuickRepliesProps) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Zap className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Quick Replies</DropdownMenuLabel>
                {QUICK_REPLIES.map((group, groupIndex) => (
                    <div key={group.category}>
                        {groupIndex > 0 && <DropdownMenuSeparator />}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground opacity-70">
                            {group.category}
                        </div>
                        {group.replies.map((reply) => (
                            <DropdownMenuItem
                                key={reply}
                                onClick={() => onSelect(reply)}
                                className="cursor-pointer"
                            >
                                {reply}
                            </DropdownMenuItem>
                        ))}
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default QuickReplies;
