// 错误结构
export interface ApiError<E = unknown> {
    code: string
    message: string
    details?: E
  }
  
  // 成功响应
  export interface ApiSuccess<T> {
    success: true
    data: T
    message?: string
    meta?: ApiMeta
  }
  
  // 失败响应
  export interface ApiFailure<E = unknown> {
    success: false
    error: ApiError<E>
  }
  
  export type ApiResponse<T, E = unknown> = ApiSuccess<T> | ApiFailure<E>
  
  /**
   * API 请求配置类型
   */
  export interface RequestConfig extends Omit<RequestInit, 'body' | 'cache'> {
    /** 请求超时时间（毫秒） */
    timeout?: number
  
    /** 失败重试次数 */
    retry?: number
  
    /** 重试延迟时间（毫秒） */
    retryDelay?: number
  
    /** 添加自定义的 noCache 属性（用于添加时间戳） */
    noCache?: boolean
  
    /** 标准的 cache 配置 */
    cache?: RequestCache
  
    /** 请求体 */
    body?: any
  }
  
  /**
   * API 元信息（用于分页等）
   */
  export interface ApiMeta {
    /** 当前页码 */
    page?: number
  
    /** 每页数量 */
    limit?: number
  
    /** 总数 */
    total?: number
  
    /** 总页数 */
    totalPages?: number
  
    /** 是否还有更多数据 */
    hasMore?: boolean
  
    /** 游标（用于游标分页） */
    cursor?: string
  
    /** 下一页游标 */
    nextCursor?: string
  
    /** 其他自定义元信息 */
    [key: string]: any
  }
  
  /**
   * 分页查询参数
   */
  export interface PaginationParams {
    page?: number
    limit?: number
  }
  
  /**
   * 游标分页查询参数
   */
  export interface CursorPaginationParams {
    cursor?: string
    limit?: number
  }
  
  /**
   * 排序参数
   */
  export interface SortParams {
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  
  /**
   * 通用查询参数
   */
  export interface QueryParams extends PaginationParams, SortParams {
    search?: string
    filter?: Record<string, any>
    [key: string]: any
  }