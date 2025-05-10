This document to useful to convey what each of this module do. These are arranged in order of their usage in the mock data fetching and processing life cycle.

# Mock Fetcher

This module is solely made to fetch data from one of the `Data Providers`.

> `Data Provider` is an interface which represents a class that can fetch data for processing. Current providers include `Coingecko` and `Pyth`.

# Strategy

A strategy is a set of instructions or an algorithm that takes in past data or current datapoint as input and returns out the outcome on that particular data point.

For now, our strategies highly rely on AI models, so under the hood, a strategy is nothing but the prompt that will be fed to AI.

# Mock Executor

This is the heart of the system. This class takes in a strategy to apply, the data set and then runs the strategy over each dataset.

From now on, the executor will take prompt from the strategy and run a `batch` of inputs using OpenAI's batch processing.

# Mock Transformer

Converts output from various strategy into a format which the frontend expects.
