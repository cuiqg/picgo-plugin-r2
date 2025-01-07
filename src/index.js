import { getPluginConfig, loadUserConfig } from './config'
import uploader from './uploader'

const pluginName = 'r2'

const upload = async (ctx) => {
  const userConfig = loadUserConfig(ctx)
  const client = uploader.createS3Client(userConfig)
  const output = ctx.output

  const tasks = output.map((item, idx) => {
    return uploader.createUploadTask({
      ctx,
      client,
      userConfig,
      item,
      index: idx
    })
  })

  let results = []

  try {
     results = await Promise.all(tasks)
  }
  catch (err) {
    ctx.log.error('上传失败，请检查网络连接和配置')
    throw err
  }

  for (const result of results) {
    const { index, url, key, error } = result
    delete output[index].buffer
    delete output[index].base64Image
    output[index].uploadPath = key
    if (error) {
      output[index].error = error
    }
    else {
      output[index].url = url
      output[index].imgUrl = url
    }
  }

  return ctx
}

// eslint-disable-next-line no-unused-vars
const remove = async (ctx, files, guiApi) => {
  const userConfig = loadUserConfig(ctx)
  const client = uploader.createS3Client(userConfig)

  const tasks = files.filter((item) => {
    const { type, imgUrl, fileName } = item
    return type === pluginName && imgUrl && fileName
  }).map((item, idx) => {
    return uploader.createRemoveTask({
      ctx,
      client,
      userConfig,
      item,
      index: idx
    })
  })

  try {
    return await Promise.all(tasks)
  }
  catch (err) {
    ctx.log.error('删除失败，请检查网络连接和配置')
    throw err
  }
}

const config = (ctx) => {
  return getPluginConfig(ctx)
}

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register(pluginName, {
      handle: upload,
      config,
      name: 'Cloudflare R2'
    })

    ctx.on('remove', (files, guiApi) => {
      remove(ctx, files, guiApi)
    })
  }

  return {
    register
  }
}
