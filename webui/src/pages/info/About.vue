<template>
  <div style="font-size: 24px; font-weight: bold;">关于</div>
  <a-divider></a-divider>
  <div class="about">
    <div style="margin-top: 32px; font-size: 14px;">
      <div>非常感谢您使用 Vertex, 当你看到这条消息时, Vertex 本身仍然是一款<span style="color: #FFB6C1; font-weight: 800;">免费</span>的软件</div>
      <div style="padding-bottom: 8px;"></div>
      <div>为了 Vertex 的稳定发展, 请不要在任何用来刷流的设备上搭建<span style="color: red">任何形式的代理工具</span>, 以免影响刷流设备与国内的网络通信</div>
      <div style="padding-bottom: 8px;"></div>
      <div>为了能够使 Vertex 与各站点间保持友好关系, 请在使用 Vertex 考虑站点的服务压力, 请做到包括但不限于以下几点:</div>
      <div> 0. 在使用 Vertex 的任何功能时, 请考虑对站点造成的影响, 包括各类网页的抓取周期等</div>
      <div> 1. 在 Rss 时, 如果 Rss 的内容本身是全部免费或者无 HR 的, 请不要开启抓取免费或排除 HR 功能</div>
      <div> 2. 站点数据的刷新不要过于频繁, 尽量保持一天 2 次甚至一天 1 次</div>
      <div style="padding-bottom: 8px;"></div>
      <div>同时, 希望您不要在各大公开社交媒体平台宣传或提及本软件, 社交平台包括但不限于 B 站 / 快手 / 抖音 / 什么值得买 等</div>
      <div style="padding-bottom: 24px;"></div>
      <div>在此，我可以肯定的告诉大家: Vertex 未来有可能会倒闭，也有可能会变质</div>
      <div style="padding-left: 300px;">---- Vertex 开发者, 栗山未来</div>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
    };
  },
  methods: {
    isMobile () {
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
      } else {
        return false;
      }
    }
  },
  async mounted () {
  }
};
</script>
<style scoped>
.about {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}
</style>
