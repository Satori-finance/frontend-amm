declare module 'vant/lib' {
  import Vue from 'vue'
  import { VanComponent } from 'vant/types/component'
  import { AddressEdit } from 'vant/types/address-edit'
  import { Area } from 'vant/types/area'
  import { Calendar } from 'vant/types/calendar'
  import { Checkbox } from 'vant/types/checkbox'
  import { CheckboxGroup } from 'vant/types/checkbox-group'
  import { CollapseItem } from 'vant/types/collapse-item'
  import { CountDown } from 'vant/types/count-down'
  import { DatetimePicker } from 'vant/types/datetime-picker'
  import { Dialog } from 'vant/types/dialog'
  import { DropdownItem } from 'vant/types/dropdown-item'
  import { Field } from 'vant/types/field'
  import { Form } from 'vant/types/form'
  import { ImagePreview } from 'vant/types/image-preview'
  import { IndexBar } from 'vant/types/index-bar'
  import { Lazyload } from 'vant/types/lazyload'
  import { List } from 'vant/types/list'
  import { Locale } from 'vant/types/locale'
  // import { Notify } from 'vant/types/notify'
  import { Picker } from 'vant/types/picker'
  import { Progress } from 'vant/types/progress'
  import { Sku } from 'vant/types/sku'
  import { Swipe } from 'vant/types/swipe'
  import { SwipeCell } from 'vant/types/swipe-cell'
  import { Tabs } from 'vant/types/tabs'
  import { Toast } from 'vant/types/toast'
  import { Uploader } from 'vant/types/uploader'

  export const version: string

  export function install(vue: typeof Vue): void

  export class ActionSheet extends VanComponent {
  }

  export class AddressList extends VanComponent {
  }

  export class Badge extends VanComponent {
  }

  export class Button extends VanComponent {
  }

  export class Card extends VanComponent {
  }

  export class Cascader extends VanComponent {
  }

  export class Cell extends VanComponent {
  }

  export class CellGroup extends VanComponent {
  }

  export class Circle extends VanComponent {
  }

  export class Col extends VanComponent {
  }

  export class Collapse extends VanComponent {
  }

  export class ContactCard extends VanComponent {
  }

  export class ContactEdit extends VanComponent {
  }

  export class ContactList extends VanComponent {
  }

  export class CouponCell extends VanComponent {
  }

  export class CouponList extends VanComponent {
  }

  export class Divider extends VanComponent {
  }

  export class DropdownMenu extends VanComponent {
  }

  export class Empty extends VanComponent {
  }

  export class Grid extends VanComponent {
  }

  export class GridItem extends VanComponent {
  }

  export class GoodsAction extends VanComponent {
  }

  export class GoodsActionButton extends VanComponent {
  }

  export class GoodsActionIcon extends VanComponent {
  }

  export class Icon extends VanComponent {
  }

  export class Image extends VanComponent {
  }

  export class IndexAnchor extends VanComponent {
  }

  export class Info extends VanComponent {
  }

  export class Loading extends VanComponent {
  }

  export class NavBar extends VanComponent {
  }

  export class NoticeBar extends VanComponent {
  }

  export class NumberKeyboard extends VanComponent {
  }

  export class Overlay extends VanComponent {
  }

  export class Pagination extends VanComponent {
  }

  export class Panel extends VanComponent {
  }

  export class PasswordInput extends VanComponent {
  }

  export class Popover extends VanComponent {
  }

  export class Popup extends VanComponent {
  }

  export class PullRefresh extends VanComponent {
  }

  export class Radio extends VanComponent {
  }

  export class RadioGroup extends VanComponent {
  }

  export class Rate extends VanComponent {
  }

  export class Row extends VanComponent {
  }

  export class Search extends VanComponent {
  }

  export class ShareSheet extends VanComponent {
  }

  export class Sidebar extends VanComponent {
  }

  export class SidebarItem extends VanComponent {
  }

  export class Skeleton extends VanComponent {
  }

  export class Slider extends VanComponent {
  }

  export class Step extends VanComponent {
  }

  export class Stepper extends VanComponent {
  }

  export class Steps extends VanComponent {
  }

  export class Sticky extends VanComponent {
  }

  export class SubmitBar extends VanComponent {
  }

  export class SwipeItem extends VanComponent {
  }

  export class Switch extends VanComponent {
  }

  export class SwitchCell extends VanComponent {
  }

  export class Tab extends VanComponent {
  }

  export class Tabbar extends VanComponent {
  }

  export class TabbarItem extends VanComponent {
  }

  export class Tag extends VanComponent {
  }

  export class TreeSelect extends VanComponent {
  }

  export {
    AddressEdit,
    Area,
    Calendar,
    Checkbox,
    CheckboxGroup,
    CollapseItem,
    CountDown,
    DatetimePicker,
    Dialog,
    DropdownItem,
    Form,
    Field,
    ImagePreview,
    IndexBar,
    Lazyload,
    List,
    Locale,
    // Notify,
    Picker,
    Progress,
    Sku,
    Swipe,
    SwipeCell,
    Tabs,
    Toast,
    Uploader,
  }
}
