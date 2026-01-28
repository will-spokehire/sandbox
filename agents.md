# Agent Guidelines for Working on Git Issues

## Workflow

### 1. Review All Open Issues
- Review complete list of open issues
- Identify dependencies and related issues
- Check for duplicate or overlapping work

### 2. Understand the Issue
- **Role**: What problem does this solve? Why is it important?
- **Scope**: What's in and out of scope?
- **Relevance**: How does this relate to other issues?
- **Dependencies**: What must be completed first?
- **Impact**: What parts of the codebase will this affect?

### 3. Review Codebase
- Read relevant files and understand current implementation
- Check existing patterns and conventions
- Review related tests

### 4. Create Implementation Plan
- Break down into manageable tasks
- Identify files to create/modify
- List new dependencies needed
- Outline testing strategy
- Consider edge cases and error handling

### 5. Implement
- Create branch: `feature/123-brief-description` or `fix/123-brief-description`
- Work in small, logical commits
- Follow project coding standards
- Write/update tests
- **NEVER create standalone documentation markdown files** (e.g., GUIDE.md, TESTING.md, SUMMARY.md, etc.)
- Only update existing README.md files if absolutely necessary

## Commit Standards

Format: `<type>(<scope>): <subject>`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example**:
```
feat(auth): implement user login functionality

- Add login endpoint with JWT authentication
- Create user validation middleware

Closes #123
```

## Pre-PR Checklist
- [ ] All tests pass
- [ ] No linter errors
- [ ] Documentation updated
- [ ] Code reviewed by yourself
- [ ] No sensitive data in commits
- [ ] No debug logs left in code

## Pull Request

**Template**:
```markdown
## Description
Brief summary of changes

## Related Issue
Closes #123

## Changes Made
- Item 1
- Item 2

## Testing Done
- Description of testing

## Breaking Changes
None / List changes
```

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code implemented and reviewed
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Code merged to main
- [ ] Issue closed

## Best Practices

1. **Read before you write** - Understand existing code first
2. **Small, focused PRs** - Easier to review
3. **Test-driven development** - Write tests first when possible
4. **Security first** - Always consider security implications
5. **Error handling** - Handle errors gracefully
6. **Ask early** - Don't assume, ask questions
7. **No documentation files** - NEVER create standalone .md files for documentation, guides, or summaries

---

**Remember**: Quality over speed. Plan properly for better outcomes.

