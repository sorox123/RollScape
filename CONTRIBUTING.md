# Contributing to RollScape

Thank you for your interest in contributing to RollScape! While the project is currently closed-source and in active development, we appreciate community feedback and bug reports.

---

## 🚫 Current Status

**RollScape is NOT accepting code contributions at this time.**

This is a closed-source project under active development. We may open source certain components in the future, but for now, the codebase is proprietary.

---

## 🐛 Reporting Bugs

If you encounter a bug, please open a GitHub issue with:

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information.
```

---

## 💡 Feature Requests

We welcome feature suggestions! Open a GitHub issue with:

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature you'd like to see.

**Use Case**
Why would this feature be useful? Who would benefit?

**Proposed Solution**
How do you envision this working?

**Alternatives Considered**
Any alternative solutions or features you've considered?

**Additional Context**
Screenshots, mockups, or examples from other apps.
```

---

## 🎯 Priority Areas

While we're not accepting code contributions, we're particularly interested in feedback on:

1. **User Experience**: UI/UX improvement suggestions
2. **AI Behavior**: DM agent and player agent performance
3. **Game Balance**: Rules interpretation and balancing
4. **Feature Ideas**: New features that would enhance gameplay
5. **Documentation**: Gaps or errors in documentation

---

## 📝 Documentation Contributions

We MAY accept documentation contributions in the future. If you find:

- Typos or grammatical errors
- Unclear instructions
- Missing information
- Outdated content

Please open an issue describing the problem. We'll review and update the documentation.

---

## 🤝 Community Guidelines

### Be Respectful

- Treat everyone with respect
- Assume good intentions
- Be constructive in criticism
- Help others when you can

### Be Clear

- Use descriptive titles for issues
- Provide sufficient context
- Include reproduction steps for bugs
- Attach relevant screenshots/logs

### Be Patient

- Maintainers will respond as time allows
- Complex issues take time to investigate
- Not all feature requests can be implemented

---

## 🛠️ Development Setup (For Reference)

If you're curious about the tech stack:

### Backend (Python 3.11+)

```bash
# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Run tests
cd backend
pytest
```

### Frontend (Node.js 18+)

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev
```

### Tech Stack

**Backend**:
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- Redis (caching)
- OpenAI API (GPT-4, DALL-E 3)
- LangChain (AI agent framework)

**Frontend**:
- Next.js 14 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- shadcn/ui (components)
- Socket.io (real-time)

---

## 📜 Code of Conduct

### Our Standards

**Positive behavior**:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community

**Unacceptable behavior**:
- Harassment, trolling, or insulting comments
- Public or private attacks
- Publishing others' private information
- Spamming or self-promotion
- Any other conduct inappropriate in a professional setting

### Enforcement

Violations of the code of conduct may result in:
1. **Warning**: First offense, verbal/written warning
2. **Temporary Ban**: Repeated violations, temporary repository ban
3. **Permanent Ban**: Severe or repeated violations, permanent ban

---

## 🚀 Future Open Source Plans

We're considering open sourcing:

1. **Dice Rolling Library**: Standalone dice notation parser
2. **AI Agent Templates**: Reusable agent patterns for LangChain
3. **UI Components**: React component library we built
4. **PDF Parser**: Character sheet PDF extraction tool

Stay tuned for updates!

---

## 🎓 Learning Resources

Interested in building something similar? Here are resources:

### AI & LangChain
- [LangChain Documentation](https://python.langchain.com/)
- [OpenAI API Guide](https://platform.openai.com/docs)
- [LangGraph Tutorial](https://langchain-ai.github.io/langgraph/)

### FastAPI
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/en/20/orm/)

### Next.js & React
- [Next.js Documentation](https://nextjs.org/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### VTT Development
- [Konva.js](https://konvajs.org/) - Canvas library for maps
- [Socket.io](https://socket.io/) - Real-time communication
- [WebRTC](https://webrtc.org/) - Voice chat (future)

---

## 📧 Contact

Have questions about contributing or the project?

- **GitHub Issues**: For bugs and feature requests
- **Email**: [Coming soon]
- **Discord**: [Coming soon]

---

## 🙏 Thank You

Even though we're not accepting code contributions, your interest in RollScape means a lot! Every bug report, feature suggestion, and piece of feedback helps make RollScape better for everyone.

**Thank you for being part of the community!** 🎲

---

**Last Updated**: January 2024  
**Version**: 1.0.0
