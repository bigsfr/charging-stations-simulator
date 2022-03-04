import { Worker, isMainThread } from 'worker_threads';
import { WorkerData, WorkerOptions, WorkerProcessType } from '../types/Worker';

import Constants from '../utils/Constants';
import { PoolOptions } from 'poolifier';
import type WorkerAbstract from './WorkerAbstract';
import WorkerDynamicPool from './WorkerDynamicPool';
import WorkerSet from './WorkerSet';
import WorkerStaticPool from './WorkerStaticPool';

export default class WorkerFactory {
  private constructor() {
    // This is intentional
  }

  public static getWorkerImplementation<T extends WorkerData>(workerScript: string, workerProcessType: WorkerProcessType, options?: WorkerOptions): WorkerAbstract<T> | null {
    if (!isMainThread) {
      throw new Error('Trying to get a worker implementation outside the main thread');
    }
    options = options ?? {} as WorkerOptions;
    options.workerStartDelay = options?.workerStartDelay ?? Constants.WORKER_START_DELAY;
    options.elementStartDelay = options?.elementStartDelay ?? Constants.ELEMENT_START_DELAY;
    options.poolOptions = options?.poolOptions ?? {} as PoolOptions<Worker>;
    options?.messageHandler && (options.poolOptions.messageHandler = options.messageHandler);
    let workerImplementation: WorkerAbstract<T> = null;
    switch (workerProcessType) {
      case WorkerProcessType.WORKER_SET:
        options.elementsPerWorker = options?.elementsPerWorker ?? Constants.DEFAULT_CHARGING_STATIONS_PER_WORKER;
        workerImplementation = new WorkerSet(workerScript, options);
        break;
      case WorkerProcessType.STATIC_POOL:
        options.poolMaxSize = options?.poolMaxSize ?? Constants.DEFAULT_WORKER_POOL_MAX_SIZE;
        workerImplementation = new WorkerStaticPool(workerScript, options);
        break;
      case WorkerProcessType.DYNAMIC_POOL:
        options.poolMinSize = options?.poolMinSize ?? Constants.DEFAULT_WORKER_POOL_MIN_SIZE;
        options.poolMaxSize = options?.poolMaxSize ?? Constants.DEFAULT_WORKER_POOL_MAX_SIZE;
        workerImplementation = new WorkerDynamicPool(workerScript, options);
        break;
      default:
        throw new Error(`Worker implementation type '${workerProcessType}' not found`);
    }
    return workerImplementation;
  }
}
