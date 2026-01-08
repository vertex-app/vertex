# Requirements Document

## Introduction

本功能包含两部分：
1. 为 VERTEX 项目创建一键安装脚本，用户可以通过简单的命令（如 `curl -sSL https://xxx/install.sh | bash`）快速在服务器上部署 VERTEX
2. 在 VERTEX 任务配置中添加运行外部脚本（如 Haruite/u2_scripts）的功能，支持 Python、Shell 等脚本的定时执行

## Glossary

- **Install_Script**: 一键安装脚本，用于自动化部署 VERTEX 的 shell 脚本
- **VERTEX**: PT 玩家的追剧刷流一体化综合管理工具
- **Docker_Compose**: Docker 编排工具，用于定义和运行多容器 Docker 应用
- **Installation_Directory**: 安装目录，VERTEX 配置文件和数据存储的位置
- **External_Script**: 外部脚本，指存储在文件系统中的 Python、Shell 等脚本文件
- **Script_Task**: 脚本任务，VERTEX 中配置的定时执行外部脚本的任务

## Part 1: VERTEX One-Click Install Script

### Requirement 1

**User Story:** As a PT user, I want to install VERTEX with a single command, so that I can quickly set up the application without manual configuration steps.

#### Acceptance Criteria

1. WHEN a user executes the Install_Script THEN the Install_Script SHALL check for required dependencies (Docker, Docker Compose)
2. WHEN required dependencies are missing THEN the Install_Script SHALL display clear instructions for installing the missing dependencies
3. WHEN all dependencies are present THEN the Install_Script SHALL proceed with the VERTEX installation automatically
4. WHEN the installation completes successfully THEN the Install_Script SHALL display the access URL and default credentials

### Requirement 2

**User Story:** As a PT user, I want the install script to configure VERTEX with sensible defaults, so that I can start using it immediately after installation.

#### Acceptance Criteria

1. WHEN the Install_Script runs THEN the Install_Script SHALL create the Installation_Directory with proper permissions
2. WHEN the Install_Script runs THEN the Install_Script SHALL generate a default configuration file with secure random passwords
3. WHEN the Install_Script runs THEN the Install_Script SHALL set up the Docker Compose configuration for VERTEX

### Requirement 3

**User Story:** As a PT user, I want the install script to set up VERTEX as a system service, so that it starts automatically after server reboot.

#### Acceptance Criteria

1. WHEN the installation completes THEN the Install_Script SHALL configure Docker containers to restart automatically
2. WHEN the installation completes THEN the Install_Script SHALL provide commands for starting, stopping, and checking VERTEX status
3. WHEN the user requests it THEN the Install_Script SHALL display logs viewing commands

### Requirement 4

**User Story:** As a PT user, I want clear error messages during installation, so that I can troubleshoot issues easily.

#### Acceptance Criteria

1. WHEN an error occurs during installation THEN the Install_Script SHALL display a descriptive error message
2. WHEN an error occurs THEN the Install_Script SHALL suggest possible solutions or next steps
3. WHEN the installation fails THEN the Install_Script SHALL clean up any partially created resources

## Part 2: External Script Runner

### Requirement 5

**User Story:** As a PT user, I want to configure external scripts like Haruite/u2_scripts in VERTEX task settings, so that I can automate site-specific tasks without writing inline JavaScript code.

#### Acceptance Criteria

1. WHEN a user creates a new script task THEN the Script_Task SHALL provide an option to select between inline JavaScript and External_Script types
2. WHEN a user selects External_Script type THEN the Script_Task SHALL display configuration fields for script path, working directory, and execution command
3. WHEN a user provides a script path THEN the Script_Task SHALL validate that the path exists on the filesystem
4. WHEN a user saves an External_Script configuration THEN the Script_Task SHALL persist the configuration to storage immediately

### Requirement 6

**User Story:** As a PT user, I want to set environment variables for external scripts, so that I can pass configuration like cookies and API keys to scripts.

#### Acceptance Criteria

1. WHEN a user configures an External_Script THEN the Script_Task SHALL provide a key-value interface for defining environment variables
2. WHEN an External_Script executes THEN the Script_Task SHALL inject all configured environment variables into the script execution context
3. WHEN a user views script configuration THEN the Script_Task SHALL mask sensitive environment variable values in the UI

### Requirement 7

**User Story:** As a PT user, I want to specify the interpreter for external scripts, so that I can run Python, Node.js, or shell scripts.

#### Acceptance Criteria

1. WHEN a user configures an External_Script THEN the Script_Task SHALL provide options to select common interpreters (python, python3, node, bash, sh)
2. WHEN a user selects an interpreter THEN the Script_Task SHALL use that interpreter to execute the script file
3. WHEN a user provides a custom command THEN the Script_Task SHALL execute the script using the custom command string

### Requirement 8

**User Story:** As a PT user, I want to run external scripts on a schedule, so that I can automate recurring tasks like signing in or checking bonuses.

#### Acceptance Criteria

1. WHEN a user configures a cron expression for an External_Script THEN the Script_Task SHALL schedule the script to run at the specified intervals
2. WHEN the scheduled time arrives THEN the Script_Task SHALL execute the External_Script with the configured parameters
3. WHEN a scheduled script is disabled THEN the Script_Task SHALL stop all future scheduled executions for that script

### Requirement 9

**User Story:** As a PT user, I want to manually trigger external scripts, so that I can test configurations or run scripts on demand.

#### Acceptance Criteria

1. WHEN a user clicks the manual run button THEN the Script_Task SHALL execute the script immediately with the configured parameters
2. WHEN a script execution starts THEN the Script_Task SHALL provide feedback indicating the script is running
3. WHEN a script execution completes THEN the Script_Task SHALL display the execution result status (success or failure)

### Requirement 10

**User Story:** As a PT user, I want to view execution logs for external scripts, so that I can debug issues and verify script behavior.

#### Acceptance Criteria

1. WHEN an External_Script executes THEN the Script_Task SHALL capture both stdout and stderr output
2. WHEN a user views script details THEN the Script_Task SHALL display the most recent execution log entries
3. WHEN an execution produces an error THEN the Script_Task SHALL record the error message and exit code in the execution log

### Requirement 11

**User Story:** As a PT user, I want to configure script execution timeout, so that I can prevent scripts from running indefinitely.

#### Acceptance Criteria

1. WHEN a user configures an External_Script THEN the Script_Task SHALL provide a timeout setting with a default value of 300 seconds
2. WHEN a script execution exceeds the configured timeout THEN the Script_Task SHALL terminate the script process and record a timeout error
3. WHEN a script is terminated due to timeout THEN the Script_Task SHALL log the timeout event with the configured timeout value
