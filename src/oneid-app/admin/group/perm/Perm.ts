import {Vue, Component, Prop, Watch} from 'vue-property-decorator';
import {Route} from 'vue-router';
import AppList from './AppList';
import PermList from './PermList';
import * as model from '@/models/oneid';
import * as api from '@/services/oneid';
import './Perm.less';

@Component({
  components: {
    AppList,
    PermList,
  },
  template: html`
  <div class="ui-group-perm-page">
    <div class="breadcrumb">
      <Breadcrumb>
        <BreadcrumbItem :to="{name: 'admin.group'}">分组管理</BreadcrumbItem>
        <BreadcrumbItem>分组权限管理</BreadcrumbItem>
      </Breadcrumb>
    </div>
    <div class="ui-group-perm-page--header">
      <img :src="user.avatar ? $fileUrl(user.avatar) : defaultAvatar" v-if="user" />
      <span>{{ title }}</span>
    </div>
    <div class="ui-group-perm-page--body">
      <div class="ui-group-perm-page--applist">
        <AppList
          v-if="group || user"
          :group="group"
          :user="user"
          @on-select="onSelectApp"
        />
      </div>
      <div class="ui-group-perm-page--perm-detail">
        <PermList
          v-if="permListProps"
          v-bind="permListProps"
        />
        <span v-else>未选择应用时，占位</span>
      </div>
    </div>
  </div>
  `,
})
export default class Perm extends Vue {
  groupId?: string;
  username?: string;

  group: model.Node|null = null;
  user: model.User|null = null;
  defaultAvatar: string = require('../../../../assets/icons/icon-Personalinformation@2x.png');

  app: any|null = null;

  permListProps: {
    app: any;
    groupId?: string;
    username?: string;
  }|null = null;

  get title() {
    const {group, user} = this;
    const name = group ? group.name
      : user ? user.name
      : '';

    return `${name}的权限管理`;
  }

  onSelectApp(app: any) {
    const {groupId, username} = this;
    this.app = app;

    const permListProps = groupId || username
      ? {app, groupId, username}
      : null;

    this.permListProps = null;
    this.$nextTick(() => this.permListProps = permListProps);
  }

  async loadData() {
    if (this.groupId) {
      this.group = await api.Node.retrieve(this.groupId!);
    } else {
      this.user = await api.User.retrieve(this.username!);
    }
  }

  created() {
    const {groupId, username} = this.$route.query;
    this.groupId = groupId as string;
    this.username = username as string;
  }

  mounted() {
    this.loadData();
  }
}
