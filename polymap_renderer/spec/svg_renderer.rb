require 'minitest/autorun'
require 'svg_renderer'

class SvgRendererTest < Minitest::Test
  def test_run_is_truthy
    assert SvgRenderer.run ""
  end
end
