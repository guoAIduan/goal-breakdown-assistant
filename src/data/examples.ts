// EXPORTS: IExample, MOCK_EXAMPLES
export interface IExample {
  id: string
  title: string
  description: string
  category: string
  icon: string
}

export const MOCK_EXAMPLES: IExample[] = [
  {
    id: '1',
    title: '制作一部AI短剧',
    description: '从剧本到宣发的完整流水线',
    category: 'AI创作',
    icon: '🎬',
  },
  {
    id: '2',
    title: '三个月备考雅思',
    description: '听说读写分科系统规划',
    category: '学习成长',
    icon: '📚',
  },
  {
    id: '3',
    title: '策划一场婚礼',
    description: '从备婚到仪式全流程',
    category: '生活管理',
    icon: '💒',
  },
  {
    id: '4',
    title: '从零做小红书副业',
    description: '账号定位到变现全链路',
    category: '创业副业',
    icon: '📱',
  },
  {
    id: '5',
    title: '开一家网店',
    description: '选品开店到运营推广',
    category: '创业副业',
    icon: '🛍️',
  },
  {
    id: '6',
    title: '跳槽面试准备',
    description: '简历面试到谈薪全攻略',
    category: '职业发展',
    icon: '💼',
  },
]