import * as process from "node:process";

// https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables
// https://docs.netlify.com/build/configure-builds/environment-variables/#read-only-variables

export default process.env.NODE_ENV !== "production"
  ? "dev"
  : process.env.GITHUB_ACTIONS
    ? "github"
    : process.env.NETLIFY
      ? Number(process.env.REVIEW_ID) || "netlify"
      : "build";
