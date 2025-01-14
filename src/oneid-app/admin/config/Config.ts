import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import {Config as ConfigApi} from '@/services/config';
import {File as FileApi} from '@/services/oneid';
import './Config.less';
import UserLogin from '../../user/UserLogin';
import {buildStyle} from '../../user/utils';

const getColorList = () => `
EF5350
F48FB1
4A148C
6200EA
0050B3
2196F3
4DD0E1
0097A7
006064
00BFA5
4CAF50
9CCC65
F9A825
FF6F00
E65100
6D4C41
424242
`.trim().split(/\n/g);

@Component
class LoginPreview extends UserLogin {
  @Prop({type: Object, required: true}) siteLogo!: object;
  loginStateCheck() {}
}


@Component({
  components: {
    LoginPreview,
  },
  template: html`
  <div class="ui-admin-config flex-col flex-auto">
    <div class="ui-admin-config-top flex-row">
      <div v-if="!loading" class="main">
        <div>
          <h2 class="subtitle">登录页面配置</h2>
        </div>
        <div class="body flex-row">
          <div class="left-info flex-col">
            <div class="logo-area flex-row">
              <div class="flex-col">
                <span>公司LOGO:</span>
                <p>图片长宽比例为1:1，大小不超过1M，主视觉元素在图形范围内清晰可见</p>
              </div>
              <img class="logo" :src="siteLogo" />
            </div>
            <div class="set-image-area flex-row">
              <Upload name="file"
                v-bind="upload"
                :on-success="onUploadSuccess"
                :show-upload-list="false"
                class="upload"
              >
                <Button type="default">点击上传</Button>
              </Upload>
              <a class="default-logo" v-if="companyLogo" @click="resetLogo" type="default">使用默认LOGO</a>
            </div>
            <span class="company-name" >公司名称:</span>
            <Input v-model="companyName" placeholder="请输入公司名称"/>

            <div class="select-color-area">
              <span>选择主色:</span>
              <p>主色包括但不限于主要按钮底色、文字按钮颜色、页面标题装饰色以及部分icon的颜色</p>
              <RadioGroup
                class="flex-col" 
                v-model="colorType" 
                vertical
              >
                <div class="default-color flex-row">
                  <Radio label="default-color">
                      <Icon type="social-apple"></Icon>
                      <span>预置颜色</span>
                  </Radio>
                  <Select 
                    class="color-selector"
                    :disabled="colorType != 'default-color'"
                    @on-change="onSelectColorChange"
                    v-model="selectColor"
                  >
                    <div class="select-bar flex-row" slot="prefix" >
                      <div class="color-bar" :style="{'color': '#' + selectColor, 'background-color': '#' + selectColor}">
                      </div>
                      <span>{{ '#' + selectColor }}</span>
                    </div>
                    <Option 
                      class="flex-row" 
                      v-for="c in colorList" 
                      :value="c" 
                      :key="c"
                    >
                      <div class="color-bar" :style="{backgroundColor: '#' + c, 'width': '48px'}">
                      </div>
                      <span>{{ '#' + c }}</span>
                    </Option>
                  </Select>
                </div>
                <div class="default-color flex-row">
                  <Radio label="custom-color">
                    <Icon type="social-android"></Icon>
                    <span>自定义颜色</span>                 
                  </Radio>
                  <div>
                    <span class="color-symbol">#</span>
                    <Input 
                      :disabled="colorType == 'default-color'" 
                      class="color-custom" 
                      v-model="customColor"
                      @on-change="onInputColorChange"
                      placeholder="输入色值"
                    />
                    <p class="color-tip">为保证按钮上的文字能被清晰识别，请勿选择过浅的颜色</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

          </div>

          <div class="right-info flex-col">
            <div class="right-preview-title"> 预览 </div>
            <div class="right-image-area">
              <div class="right-image">     
                <LoginPreview class="image-preview" ref="loginPreview"
                  :siteLogo="{logo: siteLogo, name: companyName}"
                />
                <div class="cover-image-preview"></div>
              </div>
            </div>
            <div class="preview">
              <a href="javascript: void(0)" @click="previewLarge">查看大图预览</a>  
            </div>
          </div>     
        </div>
      </div>
      
    </div>
    <div class="ui-admin-config-save flex-row">
      <div class="button-area flex-col">
        <Button class="save-button" type="primary" :loading="isSaving" @click="doSave">保存</Button>
        <a href="javascript: void(0)" @click="goAccountConfig" class="go-to-accountconfig">去进行账号配置</a>
      </div>
    </div>
    <Modal
      v-model="showPreviewLarge"
      width="1257"
      height="800"
      footer-hide
      class="ui-admin-config-preview-model"
    >
      <LoginPreview class="ui-admin-config-preview-large" ref="loginPreview"
        :siteLogo="{logo: siteLogo, name: companyName}"
      />
      <div class="ui-admin-config-login-cover"></div>
      <!-- <div class="ivu-modal-mask"></div> -->
    </Modal>
  </div>
  `,
})
export default class Config extends Vue {
  $refs: Vue['$refs'] & {
    loginPreview: LoginPreview,
  };

  defaultColor = '006064';

  config: any = null;
  loading = true;
  isSaving = false;
  customColor_ = '';

  colorList = getColorList();
  colorType: 'default-color'|'custom-color' = 'default-color';

  selectColor = '';
  companyLogo = '';
  companyName = '';
  showPreviewLarge = false;
  styleEl = null;
  get customColor() {
    return this.customColor_;
  }
  set customColor(val: string) {
    this.customColor_ = val;
  }

  get upload() {
    return {
      headers: FileApi.headers(),
      action: FileApi.baseUrl(),
    };
  }

  get siteLogo() {
    const icon = this.companyLogo;
    return icon ? FileApi.url(icon) : require('@/assets/icons/auto/defaultcompany.svg');
  }

  previewLarge() {
    this.showPreviewLarge = true;
  }

  @Watch('colorType')
  onColorTypeChange(val: string) {
    if (val === 'custom-color') {
      this.customColor = this.selectColor;
    } else {
      if (this.colorList.indexOf(this.selectColor) === -1) {
        this.selectColor = this.defaultColor;
      }
    }
  }

  mounted() {
    this.loadData();
  }

  async loadData() {
    const data = await ConfigApi.retrieve();
    this.config = data;

    const {nameCn, icon, color} = data.org;

    this.companyLogo = icon || '';
    this.companyName = nameCn;
    this.selectColor = color || this.defaultColor;

    if (this.colorList.indexOf(this.selectColor) === -1) {
      this.colorType = 'custom-color';
    }

    this.loading = false;
  }

  goAccountConfig() {
    this.$router.push({name: 'admin.account.settings'});
  }

  resetLogo() {
    this.companyLogo = '';
  }

  onUploadSuccess(resp: {file_name: string}) {
    this.companyLogo = resp.file_name;
  }

  async doSave() {
    this.isSaving = true;
    try {
      await ConfigApi.partialUpdate({
        company_config: {
          name_cn: this.companyName,
          icon: this.companyLogo,
          color: this.colorType == 'default-color'? this.selectColor : this.customColor,
        },
      });
    } catch(ex) {}

    this.isSaving = false;
    await ConfigApi.refreshMeta();

    this.$app.metaInfo = ConfigApi.cachedMeta();
    this.createStyle(this.$app.metaInfo.org.color);
  }

  cancel() {

  }

  createStyle(color: string) {
    if (this.styleEl)
    {
      document.body.removeChild(this.styleEl);
    }
    const el = this.styleEl = document.createElement('style');
    el.textContent = buildStyle(color);
    document.body.appendChild(el);
  }

  destroyed() {
    if (this.styleEl)
    {
      document.body.removeChild(this.styleEl);
    }
  }

  onSelectColorChange(event) {
    this.createStyle(event);
  }

  onInputColorChange(event) {
    this.createStyle(this.customColor);
  }
}
