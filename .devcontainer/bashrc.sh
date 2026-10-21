alias ll='ls -al'

__git_branch() {
  local branch
  branch=$(git branch --show-current 2>/dev/null) || return
  [[ -n "$branch" ]] && printf '\001\e[1;34m\002(\001\e[1;31m\002%s\001\e[1;34m\002) \001\e[0m\002' "$branch"
}

WORKSPACE_HOME=/workspaces/ddf-tools

# Make `cd` without arguments go to the workspace
cd() {
  if [[ $# -eq 0 ]]; then
    builtin cd "$WORKSPACE_HOME"
  else
    builtin cd "$@"
  fi
}

# Display the workspace as "~"
__prompt_path() {
  if [[ "$PWD" == "$WORKSPACE_HOME" ]]; then
    printf '~'
  elif [[ "$PWD" == "$WORKSPACE_HOME"/* ]]; then
    printf '~%s' "${PWD#"$WORKSPACE_HOME"}"
  else
    printf '%s' "$PWD"
  fi
}

# user ➜ ~/path (branch) $
PS1='\[\e[0;32m\]\u \[\e[0m\]➜  \[\e[1;34m\]$(__prompt_path) \[\e[0m\]$(__git_branch)\[\e[0m\]\$ '
