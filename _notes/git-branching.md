# Local Git Branches & Github Integration

## 1. Check the number of branches in your project

To list all local branches:

```sh
git branch
```

To list all remote branches:

```sh
git branch -r
```

To list both local and remote branches:

```sh
git branch -a
```

## 2. Create a new branch named "dev"

```sh
git checkout -b dev
```

This creates and switches to the "dev" branch.

Then, push it to GitHub:
```sh
git push -u origin dev
```

## 3. Merge "dev" into "master" on GitHub
Once you’ve finished making changes in the "dev" branch:

1. Ensure you're on the "master" branch:

```sh
git checkout master
```

2. Pull the latest changes to avoid conflicts:

```sh
git pull origin master
```

3. Merge "dev" into "master":

```sh
git merge dev
```

4. Push the updated "master" branch to GitHub:

```sh
git push origin master
```

## 4. Open a Pull Request (PR) on GitHub

If you want to merge using a PR instead of merging locally:

1. Push your "dev" branch (if not done yet):
```sh
git push -u origin dev
```
2. Go to your GitHub repository.
3. Click on the **"Pull Requests"** tab.
4. Click **"New Pull Request"**.
5. Choose "dev" as the source branch and "master" as the target.
6. Add a title and description, then click **"Create Pull Request"**.
7. Once reviewed, click **"Merge Pull Request"** and delete the "dev" branch if no longer needed.
