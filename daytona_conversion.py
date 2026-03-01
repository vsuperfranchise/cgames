"""Example Python script showing how to spin up a Daytona sandbox and manipulate files.

This script was provided in the user request and is included here for reference; it is not required to run the web playground.

The code below creates a Daytona sandbox, demonstrates some filesystem operations, deletes the original `workspace/cgames` folder, and then clones this repository.

All uploaded games in the web UI are expected to cost £11 and redirect to PayPal for
`solomonubani1987@gmail.com`.
"""

from daytona import Daytona, CreateSandboxFromSnapshotParams

# Initialize the Daytona client

daytona = Daytona()

params = CreateSandboxFromSnapshotParams(
    auto_stop_interval=15, # Sandbox will be stopped after 15 minutes
    auto_archive_interval=7, # Auto-archive after a Sandbox has been stopped for 7 minutes
    auto_delete_interval=-1, # Auto-delete functionality disabled
)

# Create the Sandbox instance
sandbox = daytona.create(params)
print(f"Sandbox created:{sandbox.id}")

# Create folder with specific permissions
sandbox.fs.create_folder("workspace/cgames", "755")

# List files in a directory
files = sandbox.fs.list_files("workspace/cgames")
for file in files:
    print(f"Name: {file.name}")
    print(f"Is directory: {file.is_dir}")
    print(f"Size: {file.size}")
    print(f"Modified: {file.mod_time}")

# Delete file
sandbox.fs.delete_file("workspace/cgames")

# Clone git repository
sandbox.git.clone(
    url="https://github.com/vsuperfranchise/cgames.git",
    path="workspace/repo",
    branch="/",
    commit_id="/",
    username="vsuperfranchise",
    password="Deliverstats@517"
)

# Get repository status
status = sandbox.git.status("workspace/cgames")
print(f"Current branch: {status.current_branch}")
print(f"Commits ahead: {status.ahead}")
print(f"Commits behind: {status.behind}")
for file_status in status.file_status:
    print(f"File: {file_status.name}")

# List branches
branchesResponse = sandbox.git.branches("workspace/cgames")
for branch in branchesResponse.branches:
    print(f"Branch: {branch}")
