import {Vue, Component, Prop} from 'vue-property-decorator';
import {cloneDeep} from 'lodash';
import * as api from '@/services/oneid';
import * as model from '@/models/oneid';
import {FORM_RULES} from '@/utils';

import ChooseNode from '@/oneid-app/comps/choose/Choose';
import './EditUser.less';

@Component({
  components: {
    ChooseNode,
  },
  template: html`
  <div>
    <Drawer
      placement="right"
      v-model="showDrawer"
      :closable="false"
      :maskClosable="true"
      :width="580"
      :transfer="true"
      className="ui-edit-user"
    >
      <div class="title">{{ isNew ? "添加账号" : "编辑账号" }}</div>
      <Form
        v-if="showDrawer"
        :model="form"
        :rules="rules"
        labelPosition="right"
        :labelWidth="100"
        ref="form"
        class="form"
      >
        <FormItem prop="username" label="用户名" v-if="isNew">
          <Input type="text" v-model="form.username" :maxlength="16" placeholder="请输入 用户名"></Input>
        </FormItem>
        <FormItem prop="username" label="用户名" v-else>
          <Input type="text" v-model="form.username" :maxlength="16" placeholder="请输入 用户名" readonly></Input>
        </FormItem>
        <FormItem prop="name" label="姓名">
          <Input type="text" v-model="form.name" :maxlength="16" placeholder="请输入 姓名"></Input>
        </FormItem>
        <FormItem prop="mobile" label="手机">
          <Input type="text" v-model="form.mobile" placeholder="请输入 手机"></Input>
        </FormItem>
        <FormItem prop="privateEmail" label="个人邮箱">
          <Input type="text" v-model="form.privateEmail" placeholder="请输入 邮箱"></Input>
        </FormItem>
        <FormItem prop="email" label="邮箱">
          <Input type="text" v-model="form.email" placeholder="请输入 邮箱"></Input>
        </FormItem>
        <FormItem
          prop="nodes" :label="item.name"
          v-for="item in metaNodes" :key="item.id">
          <Input type="text"
            :value="form.nodes ? form.nodes.filter(i => i.nodeSubject === item.nodeSubject).map(i => i.name).join(',') : ''"
            @click.native="doShowModal(item)"
            readonly
            :placeholder="'请添加' + item.name"
           ></Input>
        </FormItem>
      </Form>
      <div class="drawer-footer flex-row flex-auto">
        <Button type="default" @click="doCancel">取消</Button>
        <Button type="error" @click="remove" v-if="!isNew">删除</Button>
        <div class="flex-row flex-auto"></div>
        <Button type="primary" @click="doSave()" :loading="isSaving">{{ isNew ? '添加' : '保存' }}</Button>
        <Button type="primary" @click="doSaveAndContinue()" :loading="isSaving" v-if="isNew">保存并继续添加</Button>
      </div>
    </Drawer>

    <ChooseNode
      v-if="chooseNode"
      v-bind="chooseNode"
      ref="chooseNode"
      @on-ok="onChooseNodeOk"
    />
  </div>
  `,
})
export default class EditUser extends Vue {
  $refs!: {
    chooseNode: ChooseNode,
  };

  @Prop({type: model.User}) user?: model.User;
  @Prop({type: model.Node}) node?: model.Node;

  metaNodes: model.Node[] = [];

  showDrawer = false;
  form: model.User|null = null;
  isSaving = false;

  chooseNode: {
    metaNode: model.Node;
    title: string;
    multiple: boolean;
    checkedIds: string[];
  }|null = null;

  get rules() {
    const mobileOrEmailRquiredRule = {
      trigger: 'blur',
      validator: (rule: any, value: string, cb: any) => {
        if (this.form!.mobile || this.form!.privateEmail) {
          cb();
        } else {
          cb(new Error('手机、邮箱不能同时为空'));
        }
      },
    };

    return {
      username: [FORM_RULES.required, FORM_RULES.username],
      name: [FORM_RULES.required, FORM_RULES.name],
      mobile: [FORM_RULES.mobile, mobileOrEmailRquiredRule],
      email: [FORM_RULES.email, mobileOrEmailRquiredRule],
    };
  }

  get isNew() {
    return !this.form!.id;
  }

  initForm() {
    const {user, node} = this;
    if (user) {
      this.form = cloneDeep(user);
    } else {
      const form = new model.User();
      form.nodes = node ? [node] : [];
      this.form = form;
    }
  }

  async show() {
    this.showDrawer = true;
  }

  async loadMetaNodes() {
    const [defaultMetaNode, customMetaNode] = await api.Node.metaNode();
    this.metaNodes = [...defaultMetaNode.children, ...customMetaNode.children];
  }

  doShowModal(metaNode: model.Node) {
    const checkedIds = this.form!.nodes!
      .filter(n => n.nodeSubject === metaNode.nodeSubject)
      .map(i => i.id);

    this.chooseNode = {
      metaNode,
      title: `选择${metaNode.name}`,
      multiple: true,
      checkedIds,
    };
    this.$nextTick(() => this.$refs.chooseNode.show());
  }

  onChooseNodeOk(checkedNodes: model.Node[]) {
    const {metaNode} = this.chooseNode!;
    const {nodes} = this.form!;

    this.form!.nodes = [
      ...nodes!.filter((i: model.Node) => i.nodeSubject !== metaNode!.nodeSubject),
      ...checkedNodes,
    ];
  }

  async remove() {
    this.$Loading.start();
    try {
      await api.User.remove(this.form);
      this.$Loading.finish();
      this.$emit('on-save');
      this.showDrawer = false;
    } catch (e) {
      this.$Loading.error();
      this.$emit('on-save');
    }
  }

  async doSave(isNext: boolean = false) {
    const isValid = await this.$refs.form.validate();
    if (!isValid) {
      return;
    }

    this.$Loading.start();
    try {
      if (this.isNew) {
        await api.User.create(this.form!);
      } else {
        await api.User.partialUpdate(this.form!);
      }
      this.$Loading.finish();
      this.$Message.success('保存成功');

      if (isNext) {
        this.initForm();
      } else {
        this.showDrawer = false;
      }
    } catch (e) {
      if (e.status === 400) {
        if (e.data.username && e.data.username.includes('this value has be used')) {
          this.$Message.error('保存失败：用户名被占用');
        }
        if (e.data.mobile && e.data.mobile.includes('existed')) {
          this.$Message.error('保存失败：手机号被占用');
        }
        if (e.data.email && e.data.email.includes('existed')) {
          this.$Message.error('保存失败：邮箱被占用');
        }
      }
      this.$Loading.error();
    }

    this.$emit('on-save');
  }

  async doSaveAndContinue() {
    this.doSave(true);
  }

  doCancel() {
    this.showDrawer = false;
  }

  created() {
    this.initForm();
  }

  mounted() {
    this.loadMetaNodes();
  }
}
