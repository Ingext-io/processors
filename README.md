### Processors
The code the executes inside of Ingext

Processors are the workhorse of Ingext.  The structure is the similar, but what the do changes.

## Types
The basic processors are:
* parsers: Transforms records of incoming streams
* actions: Designed to call out of the pipes to perfrom an interaction.
* cron: A process that has a timed kickoff.
* lambdas: S3 Utilities
* receivers: Run during the initial data source read.
* rules: Secondary processes that occur after the critical path.

