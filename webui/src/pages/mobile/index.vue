<template>
  <div>
    <div style="position: relative; height: 56px;">
      <fa :icon="['fas', 'home']" @click="$goto('/mobile/home', $router)" style="color: grey; font-size: 20px; left: 20px; position: absolute; top: 20px;"></fa>
      <fa :icon="['fas', 'desktop']" @click="gotoDesktop()" style="color: grey; font-size: 20px; right: 20px; position: absolute; top: 20px;"></fa>
    </div>
    <div style="height: calc(var(--vh, 1vh) * 100 - 56px); overflow: auto;">
      <router-view></router-view>
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
    gotoDesktop () {
      window.location.href = '/home';
    }
  },
  mounted () {
  }
};
</script>

<style scoped>

</style>
