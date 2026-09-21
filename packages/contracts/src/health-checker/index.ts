export interface IHealthChecker {
  ping(): Promise<boolean>
}
