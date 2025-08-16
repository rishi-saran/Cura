# utils.py

import re

def format_response_for_chatbot(text):
    """
    Formats GPT response into a structured HTML format.
    - Adds line breaks
    - Indents list items
    - Highlights headings
    - Converts markdown to HTML-style formatting
    """
    lines = text.strip().split("\n")
    formatted = []

    for line in lines:
        line = line.strip()

        # Convert markdown bold like **Title** to HTML <b>Title</b>
        line = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", line)

        # Convert numbered headers (1. Title)
        if re.match(r"^\d+\.\s", line):
            line = f"<br><b>{line}</b>"

        elif line.startswith("- "):
            line = f"&nbsp;&nbsp;&nbsp;&nbsp;{line}"

        formatted.append(line + "<br>")

    return ''.join(formatted)
