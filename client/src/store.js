import Vue from 'vue'
import Vuex from 'vuex'
import Axios from 'axios'
import router from './router'
import { runInNewContext } from 'vm';

Vue.use(Vuex)
let base = window.location.host.includes('localhost:8080') ? '//localhost:3000/' : '/'

let auth = Axios.create({
  baseURL: base + "auth/",
  timeout: 9000,
  // was 3000
  withCredentials: true
})

let api = Axios.create({
  baseURL: base + "api/",
  timeout: 9000,
  withCredentials: true
})


export default new Vuex.Store({
  state: {
    user: {},
    members: [],
    house: {},
    houses: [],
    chores: []

  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    setActiveHouse(state, house) {
      state.house = house
    },
    setHouses(state, houses) {
      state.houses = houses
    },
    setChores(state, chores) {
      state.chores = chores
    },
    setMembers(state, members) {
      state.members = members
    }
  },
  actions: {

    //#region -- AUTH STUFF --
    register({ commit, dispatch }, newUser) {
      auth.post('register', newUser)
        .then(res => {
          commit('setUser', res.data)
          router.push({ name: 'createhouse' })
        })
    },
    authenticate({ commit, dispatch }) {
      auth.get('authenticate')
        .then(res => {
          commit('setUser', res.data)
          dispatch('getHousesByMember', res.data._id)
          // router.push({ name: 'boards' })
        })
        .catch(res => {
          router.push({ name: 'login' })
        })
    },
    login({ commit, dispatch }, creds) {
      auth.post('login', creds)
        .then(res => {
          commit('setUser', res.data)
          dispatch('getHousesByMember', res.data._id)
        })

    },
    logout({ commit, dispatch }) {
      auth.delete('logout')
        .then(res => {
          router.push({ name: 'login' })
        })
    },
    //#endregion
    //#region --House Stuff--
    async addHouse({ commit, dispatch }, newHouse) {
      await api.post('/house', newHouse)
        .then(res => {
          dispatch('getHousesByMember', newHouse.superAdmin)
        })
    },
    async getActiveHouse({ commit, dispatch }, houseId) {
      await api.get('/house/' + houseId)
        .then(res => {
          commit('setActiveHouse', res.data)
        })
    },

    async getHouses({ commit, dispatch }) {
      await api.get('/house/')
        .then(res => {
          commit('setHouses', res.data)
          router.push({ name: 'houses' })
        })
    },

    async getHousesByMember({ commit, dispatch }, userId) {
      await api.get('/users/' + userId + '/house')
        .then(res => {
          commit('setHouses', res.data)
          router.push({ name: 'houses' })
        })
    },
    // #endregion
    // #region --CHORES--
    async createChore({ commit, dispatch }, newChore) {
      await api.post('/chores', newChore)
        .then(res => {

          dispatch('getChores', res.data.houseId)
        })
    },
    async getChores({ commit, dispatch }, houseId) {
      await api.get('/house/' + houseId + '/chores')
        .then(res => {

          commit('setChores', res.data)
        })
    },
    async deleteChore({ commit, dispatch }, data) {
      await api.delete('/chores/' + data._id)
        .then(res => {
          dispatch('getChores', data.houseId)
        })
    },
    async editChore({ commit, dispatch }, data) {

      let res = await api.put('/chores/' + data._id, data)
        .then(res => {

          dispatch('getChores', data.editedChore.houseId)
        })
    },

    //#endregion
    // #region --Settings--
    async addMember({ commit, dispatch }, data) {
      await api.put('/house/' + data.houseId + '/user/', data)
        .then(res => {
          dispatch('getMembers', data.houseId)
        })
    },

    async getMembers({ commit, dispatch }, houseId) {
      await api.get('/house/' + houseId + '/users')
        .then(res => {
          commit('setMembers', res.data.members)
        })
    },
    async deleteMember({ commit, dispatch }, payload) {
      await api.put('/house/' + payload.house + '/user/' + payload._id)
        .then(res => {
          dispatch('getMembers', payload.house)
        })
    }

  },
  // #endregion
  getters: {
    isAdmin(state) {
      debugger
      return state.house.admins ? state.house.admins.findIndex(a => a == state.user._id) > -1 : false
    }
  }

})

