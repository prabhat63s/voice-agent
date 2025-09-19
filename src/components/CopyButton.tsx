import { useState } from "react";
import { FaRegClipboard, FaCheck } from "react-icons/fa";

interface CopyButtonProps {
    text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-neutral-800 text-white opacity-0 group-hover:opacity-100 transition"
        >
            {copied ? (
                <span className="flex items-center gap-1">
                    <FaCheck /> Copied
                </span>
            ) : (
                <span className="flex items-center gap-1">
                    <FaRegClipboard /> Copy
                </span>
            )}
        </button>
    );
};

export default CopyButton;
