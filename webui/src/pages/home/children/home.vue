<template>
  <div class="site-settings">
    Hey!  version: {{version}}
  </div>
</template>

<script>
export default {
  data () {
    return {
      version: 'dev'
    };
  },
  mounted () {
    this.version = process.env.version || this.version;
  }
};
</script>

<style scoped>

</style>
