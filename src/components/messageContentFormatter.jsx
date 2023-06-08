const messageContentFormatter = (content, isOutgoing) => {
    const lines = content.split('\n');
  
    let formattedLines = [];
    let listType = null;
    let listItems = [];
  
    const processList = () => {
      if (listItems.length > 0) {
        if (listType === 'bullet') {
          formattedLines.push(<ul key={formattedLines.length}>{listItems.map((item, index) => <li key={index}>{item}</li>)}</ul>);
        } else if (listType === 'numbered') {
          formattedLines.push(<ol key={formattedLines.length}>{listItems.map((item, index) => <li key={index}>{item}</li>)}</ol>);
        }
        listItems = [];
      }
      listType = null;
    };
  
    const formatInlineCode = (line) => {
      const parts = line.split('`');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <code className="inline-code" key={index}>{part}</code>;
        }
        return part;
      });
    };
  
    lines.forEach((line) => {
      const trimmedLine = line.trim();
  
      if (trimmedLine.startsWith('- ')) {
        listType = 'bullet';
        listItems.push(trimmedLine.slice(2));
      } else if (trimmedLine.match(/^\d+\./)) {
        listType = 'numbered';
        listItems.push(trimmedLine.slice(trimmedLine.indexOf('.') + 2));
      } else if (trimmedLine !== '') {
        if (listType) {
          processList();
        }
        const formattedLine = formatInlineCode(trimmedLine);
        formattedLines.push(
          <p className={`paragraph ${isOutgoing ? 'message-outgoing-bubble' : ''}`} key={formattedLines.length}>
            {formattedLine}
          </p>
        );
      }
    });
  
    if (listType) {
      processList();
    }
  
    return formattedLines.map((line, index) => <div key={index}>{line}</div>);
};

export default messageContentFormatter