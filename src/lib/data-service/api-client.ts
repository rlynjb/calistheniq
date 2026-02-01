/**
 * API Client for making HTTP requests to backend services
 */

import { DATA_SOURCE_CONFIG } from './config'

/**
 * NOTE:
 * check if these types are defined in BE.
 */
export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
  error?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

class ApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = DATA_SOURCE_CONFIG.API_BASE_URL
    this.timeout = DATA_SOURCE_CONFIG.TIMEOUT
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        data,
        success: true,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined,
      }
      
      throw apiError
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }
    
    return this.request<T>(url.toString(), {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient()
