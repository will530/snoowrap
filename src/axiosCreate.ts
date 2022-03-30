declare module 'axios' {
  export interface AxiosRequestConfig {
    form?: {
      [key: string]: any
    }
    formData?: {
      [key: string]: any
    }
    _r?: any
  }
}

import axios, {AxiosRequestConfig, AxiosResponse, AxiosError} from 'axios'
import URLSearchParams from './helpers/URLSearchParams'
import FormData from './helpers/FormData'
import isBrowser from './helpers/isBrowser'

function axiosCreate (baseConfig?: AxiosRequestConfig) {
  const instance = axios.create(baseConfig)

  instance.interceptors.request.use(async config => {
    if (config.formData) {
      const requestBody = new FormData()
      for (const key of Object.keys(config.formData)) requestBody.append(key, config.formData[key])
      if (!isBrowser) {
        const contentLength: number = await new Promise((resolve, reject) => {
          requestBody.getLength((err, length) => {
            if (err) reject(err)
            resolve(length)
          })
        })
        config.headers!['content-length'] = contentLength
        config.headers!['content-type'] = `multipart/form-data; boundary=${requestBody.getBoundary()}`
      }
      config.data! = requestBody
    } else if (config.form) {
      const requestBody = new URLSearchParams()
      for (const key of Object.keys(config.form)) requestBody.append(key, config.form[key])
      config.data = requestBody.toString()
      config.headers['content-type'] = 'application/x-www-form-urlencoded'
    }
    if (isBrowser) {
      delete config.headers['user-agent']
    }
    if (config._r && config._r._debug) {
      config._r._debug('Request:', config)
    }
    return config
  })

  instance.interceptors.response.use(response => {
    if (response.config._r && response.config._r._debug) {
      response.config._r._debug('Response:', response)
    }
    return response
  })

  return instance
}

export default axiosCreate
export {AxiosRequestConfig, AxiosResponse, AxiosError}
