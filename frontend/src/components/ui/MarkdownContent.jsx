import ReactMarkdown from "react-markdown";

export function MarkdownContent({ content }) {
  if (!content) return null;

  // Convert hashtags (#tag) into markdown links to "#" so we can intercept them in the 'a' component
  // We use a negative lookbehind to ensure we don't match # inside URLs or other links
  const processedContent = content.replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, '$1[$2](#)');

  return (
    <div className="prose prose-sm max-w-none text-slate-600 prose-img:rounded-xl prose-img:shadow-md">
      <ReactMarkdown
        components={{
          img: ({ node, ...props }) => (
            <img {...props} className="mt-3 max-h-96 w-auto rounded-xl object-contain border border-slate-200" />
          ),
          a: ({ node, ...props }) => {
            const href = props.href || "";
            // Intercept our hashtag trick
            if (href === "#") {
              return <span className="font-extrabold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md mx-0.5">{props.children}</span>;
            }
            // Check if this is a video URL (e.g. from our storage)
            if (href.match(/\.(mp4|webm|ogg)$/i) || props.children?.[0] === "Video đính kèm") {
              return (
                <video
                  controls
                  className="mt-3 max-h-96 w-full rounded-xl border border-slate-200 shadow-md bg-slate-900"
                  src={href}
                />
              );
            }
            return (
              <a {...props} className="text-violet-600 hover:underline hover:text-violet-700 font-medium" target="_blank" rel="noreferrer" />
            );
          },
          p: ({ node, ...props }) => <p {...props} className="whitespace-pre-wrap mb-2 leading-relaxed" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
